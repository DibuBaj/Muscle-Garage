import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
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
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pause Subscription</Text>
              <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {!!successMessage && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.bannerText}>{successMessage}</Text>
                </View>
              )}

              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={20} color={Colors.error} />
                  <Text style={styles.bannerText}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Pause for 1 to 7 days, once per month. Your end date extends by the paused duration.
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pauseButton, (!isValidDuration || loading) && styles.pauseButtonDisabled]}
                onPress={handlePauseSubscription}
                disabled={!isValidDuration || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.pauseButtonText}>Pause</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 460,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(40, 167, 69, 0.12)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(196, 23, 23, 0.12)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  bannerText: {
    color: Colors.white,
    fontSize: 13,
    flex: 1,
    fontFamily: 'Poppins',
  },
  infoBox: {
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(229, 122, 37, 0.3)',
  },
  infoText: {
    color: Colors.white,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  dateSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: 'Poppins',
  },
  dateButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    gap: 10,
  },
  dateButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    fontFamily: 'Poppins',
  },
  durationInfo: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    fontFamily: 'Poppins',
  },
  durationTextValid: {
    color: Colors.success,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pauseButtonDisabled: {
    opacity: 0.6,
  },
  pauseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
});
