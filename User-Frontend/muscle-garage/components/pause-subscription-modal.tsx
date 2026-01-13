import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface PauseSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  token: string | null;
  onPauseSuccess: () => void;
}

export default function PauseSubscriptionModal({
  visible,
  onClose,
  token,
  onPauseSuccess,
}: PauseSubscriptionModalProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const calculateDaysDifference = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // Set end date to at least 1 day after start
      const newEndDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);
      setEndDate(newEndDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      const daysDiff = calculateDaysDifference(startDate, selectedDate);
      if (daysDiff < 1) {
        setErrorMessage('Pause must be at least 1 day');
        setTimeout(() => setErrorMessage(''), 3000);
      } else if (daysDiff > 7) {
        setErrorMessage('Pause cannot exceed 7 days. Contact gym administration for longer pauses.');
        setTimeout(() => setErrorMessage(''), 3000);
      } else {
        setEndDate(selectedDate);
        setErrorMessage('');
      }
    }
  };

  const handlePauseSubscription = async () => {
    const daysDiff = calculateDaysDifference(startDate, endDate);

    if (daysDiff < 1 || daysDiff > 7) {
      setErrorMessage('Pause duration must be between 1 and 7 days');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      console.log('Sending pause request with:');
      console.log('Start Date:', startDate.toISOString());
      console.log('End Date:', endDate.toISOString());
      console.log('Days difference:', daysDiff);
      
      const response = await axios.post(
        `${API_URL}/subscription/pause`,
        {
          pauseStartDate: startDate.toISOString(),
          pauseEndDate: endDate.toISOString(),
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Subscription paused successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          onPauseSuccess();
          onClose();
          // Reset dates
          const now = new Date();
          setStartDate(now);
          setEndDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
        }, 2000);
      }
    } catch (error: any) {
      console.error('Pause error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to pause subscription';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const daysDiff = calculateDaysDifference(startDate, endDate);
  const isValidDuration = daysDiff >= 1 && daysDiff <= 7;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {successMessage ? (
        <View style={styles.successNotification}>
          <View style={styles.notificationContent}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} style={styles.notificationIcon} />
            <Text style={styles.notificationText}>{successMessage}</Text>
          </View>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorNotification}>
          <View style={styles.notificationContent}>
            <Ionicons name="alert-circle" size={24} color={Colors.error} style={styles.notificationIcon} />
            <Text style={styles.notificationText}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Pause Subscription</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close-circle" size={28} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⏸️ You can pause your subscription for 1 to 7 days. This option can be used once per month. For pauses longer than 7 days, please contact Muscle Garage administration.
            </Text>
          </View>

          <View style={styles.dateSection}>
            <Text style={styles.label}>Pause Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
              disabled={loading}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="spinner"
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.dateSection}>
            <Text style={styles.label}>Pause End Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
              disabled={loading}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="spinner"
              onChange={handleEndDateChange}
              minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
            />
          )}

          <View style={styles.durationInfo}>
            <Text style={[styles.durationText, isValidDuration && styles.durationTextValid]}>
              Duration: {daysDiff} day{daysDiff !== 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.pauseButton, (!isValidDuration || loading) && styles.pauseButtonDisabled]}
            onPress={handlePauseSubscription}
            disabled={!isValidDuration || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.pauseButtonText}>Pause Subscription</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  infoBox: {
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  infoText: {
    color: Colors.white,
    fontSize: 13,
    lineHeight: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    gap: 12,
  },
  dateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  durationInfo: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  durationTextValid: {
    color: Colors.success,
  },
  pauseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  pauseButtonDisabled: {
    opacity: 0.6,
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.lightGray,
  },
  successNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  errorNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(196, 23, 23, 0.95)',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
