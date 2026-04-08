import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  RefreshControl,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import axios from 'axios';
import { API_URL } from '@/constants/api';
import ToastNotification from '@/components/toast-notification';
import Animated from 'react-native-reanimated';
import { useLiquidTabBarScrollHandler } from '@/components/shared/tabBarVisibility';

interface UserDetails {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  username: string;
  dateOfBirth?: string;
  weight?: number;
}

const toDateOnlyString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateForForm = (value?: string | Date | null) => {
  if (!value) return '';

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : toDateOnlyString(value);
  }

  const [dateOnlyPart] = value.split('T');
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnlyRegex.test(dateOnlyPart)) return dateOnlyPart;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  if (!value) return null;
  const normalized = normalizeDateForForm(value);
  if (!normalized) return null;

  const [yearStr, monthStr, dayStr] = normalized.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildFormData = (source: Partial<UserDetails> | null | undefined): UserDetails => ({
  id: source?.id ?? '',
  fullname: source?.fullname ?? '',
  email: source?.email ?? '',
  phone: source?.phone ?? '',
  username: source?.username ?? '',
  dateOfBirth: normalizeDateForForm(source?.dateOfBirth),
  weight: typeof source?.weight === 'number' ? source.weight : 0,
});

export default function SettingsScreen() {
  const { user, logout, token, updateUserContext } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [iosDobDraft, setIosDobDraft] = useState<Date | null>(null);
  const [deleteOtpModalVisible, setDeleteOtpModalVisible] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [sendingDeleteOtp, setSendingDeleteOtp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const today = new Date();

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const [formData, setFormData] = useState<UserDetails>(() => buildFormData(user));

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const scrollHandler = useLiquidTabBarScrollHandler();

  const sanitizePhone = (value: string) => value.replace(/\D/g, '');

  const handlePhoneChange = (text: string) => {
    if (/\D/.test(text)) {
      setErrorMessage('Phone must contain numbers only');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }
    setFormData({ ...formData, phone: text });
  };

  const fetchUserProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          Authorization: token,
        },
      });

      if (response.data.success) {
        const userData = response.data.user;
        setFormData(buildFormData(userData));
        setProfilePicture(userData.profilePicture || null);
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      // Fallback to user from context if API fails
      if (user) {
        setFormData(buildFormData(user));
        setProfilePicture(user.profilePicture || null);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchUserProfile();
    requestImagePermissions();
  }, [fetchUserProfile]);

  const requestImagePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      console.log('Image picker permission not granted');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  const openDobPicker = () => {
    if (Platform.OS === 'ios') {
      setIosDobDraft(parseDateForPicker(formData.dateOfBirth) || today);
    }
    setShowDobPicker(true);
  };

  const cancelDobSelection = () => {
    setShowDobPicker(false);
    setIosDobDraft(null);
  };

  const confirmDobSelection = () => {
    if (iosDobDraft) {
      setFormData({
        ...formData,
        dateOfBirth: toDateOnlyString(iosDobDraft),
      });
    }
    setShowDobPicker(false);
    setIosDobDraft(null);
  };

  const handleUpdateProfile = async () => {
    const sanitizedPhone = sanitizePhone(formData.phone || '');
    const dateOfBirthToSave = normalizeDateForForm(
      iosDobDraft ? toDateOnlyString(iosDobDraft) : formData.dateOfBirth
    );

    if (!formData.fullname || !formData.email || !sanitizedPhone || !formData.username) {
      setErrorMessage('Please fill in all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (!/^\d+$/.test(formData.phone || '')) {
      setErrorMessage('Phone must contain numbers only');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/user/profile`,
        {
          fullname: formData.fullname,
          email: formData.email,
          phone: sanitizedPhone,
          username: formData.username,
          dateOfBirth: dateOfBirthToSave || undefined,
          weight: formData.weight,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user;
        if (updatedUser) {
          const normalizedUpdatedUser = {
            ...updatedUser,
            dateOfBirth: updatedUser.dateOfBirth || dateOfBirthToSave,
          };
          setFormData(buildFormData(normalizedUpdatedUser));
          await updateUserContext(normalizedUpdatedUser);
        } else {
          setFormData({
            ...formData,
            dateOfBirth: dateOfBirthToSave,
          });
        }
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error: any) {
      console.error('Update error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMessage('Please fill in all password fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/user/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to change password. Please try again.';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth-choice');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      setErrorMessage('Failed to select image');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploadingImage(true);

      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /(\.\w+)$/.exec(filename);
      const type = match ? `image/${match[1].replace('.', '')}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        // On web, convert the URI to a Blob so the browser sets multipart boundaries
        const res = await fetch(uri);
        const blob = await res.blob();
        formData.append('profilePicture', blob, filename);
      } else {
        // On native, send the file descriptor
        formData.append('profilePicture', {
          uri,
          name: filename,
          type,
        } as any);
      }

      const response = await axios.post(
        `${API_URL}/user/profile-picture`,
        formData,
        {
          headers: {
            Authorization: token?.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`,
            // Only set content-type manually for native; browser will add the boundary
            ...(Platform.OS !== 'web' ? { 'Content-Type': 'multipart/form-data' } : {}),
          },
          transformRequest: [(data) => data],
        }
      );

      if (response.data.success) {
        setProfilePicture(response.data.profilePicture);
        await updateUserContext({ profilePicture: response.data.profilePicture });
        setSuccessMessage('Profile picture updated successfully!');
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error: any) {
      console.error('Upload image error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to upload image';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteImage = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingImage(true);
              const response = await axios.delete(`${API_URL}/user/profile-picture`, {
                headers: {
                  Authorization: token,
                },
              });

              if (response.data.success) {
                await updateUserContext({ profilePicture: undefined });
                setProfilePicture(null);
                setSuccessMessage('Profile picture removed successfully!');
                setTimeout(() => setSuccessMessage(''), 2000);
              }
            } catch (error: any) {
              console.error('Delete image error:', error);
              const errorMsg = error.response?.data?.message || 'Failed to delete image';
              setErrorMessage(errorMsg);
              setTimeout(() => setErrorMessage(''), 3000);
            } finally {
              setUploadingImage(false);
            }
          },
        },
      ]
    );
  };

  const sendDeleteAccountOtp = async () => {
    try {
      setSendingDeleteOtp(true);
      const response = await axios.post(
        `${API_URL}/user/delete-account/send-otp`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        setDeleteOtp('');
        setDeleteOtpModalVisible(true);
        setSuccessMessage('OTP sent to your email');
        setTimeout(() => setSuccessMessage(''), 2500);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to send delete account OTP';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSendingDeleteOtp(false);
    }
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. Your account details will be deleted, but order, booking, and subscription records will be kept. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: sendDeleteAccountOtp,
        },
      ]
    );
  };

  const verifyDeleteAccountOtp = async () => {
    if (!deleteOtp.trim()) {
      setErrorMessage('Please enter OTP');
      setTimeout(() => setErrorMessage(''), 2500);
      return;
    }

    try {
      setDeletingAccount(true);
      const response = await axios.post(
        `${API_URL}/user/delete-account/verify-otp`,
        { otp: deleteOtp.trim() },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (response.data.success) {
        setDeleteOtpModalVisible(false);
        setDeleteOtp('');
        await logout();
        router.replace('/auth-choice');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete account';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <View style={styles.container}>
      <ToastNotification
        visible={!!successMessage}
        message={successMessage}
        type="success"
      />
      <ToastNotification
        visible={!!errorMessage}
        message={errorMessage}
        type="error"
      />

      <SafeAreaView style={styles.container}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
          </View>

          {profileLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
            {/* Profile Picture Section */}
            <View style={styles.profilePictureSection}>
              <View style={styles.profilePictureContainer}>
                {uploadingImage ? (
                  <View style={styles.profilePicture}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                ) : profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.profilePicture}
                  />
                ) : (
                  <View style={styles.profilePicturePlaceholder}>
                    <Ionicons name="person" size={60} color={Colors.darkGray} />
                  </View>
                )}
                
                {!uploadingImage && (
                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={20} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.profilePictureInfo}>
                <Text style={styles.profileName}>{formData.fullname}</Text>
                <Text style={styles.profileUsername}>@{formData.username}</Text>
                
                <View style={styles.profilePictureActions}>
                  <TouchableOpacity
                    style={styles.changePictureButton}
                    onPress={pickImage}
                    disabled={uploadingImage}
                  >
                    <Ionicons name="image-outline" size={18} color={Colors.white} />
                    <Text style={styles.changePictureText}>
                      {profilePicture ? 'Change Photo' : 'Upload Photo'}
                    </Text>
                  </TouchableOpacity>

                  {profilePicture && (
                    <TouchableOpacity
                      style={styles.removePictureButton}
                      onPress={deleteImage}
                      disabled={uploadingImage}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* User Profile Section */}
            <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={28} color={Colors.primary} />
            <View>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <Text style={styles.sectionSubtitle}>View and edit your details</Text>
            </View>
          </View>

          {!isEditing ? (
            <>
              <View style={styles.infoCard}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{formData.fullname}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{formData.username}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{formData.email}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{formData.phone}</Text>
                </View>

                {formData.dateOfBirth ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Date of Birth</Text>
                      <Text style={styles.infoValue}>{formatDate(formData.dateOfBirth)}</Text>
                    </View>
                  </>
                ) : null}

                {formData.weight ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Weight</Text>
                      <Text style={styles.infoValue}>{formData.weight} kg</Text>
                    </View>
                  </>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="pencil" size={18} color={Colors.white} />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.formCard}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.fullname}
                    onChangeText={(text) =>
                      setFormData({ ...formData, fullname: text })
                    }
                    placeholderTextColor={Colors.darkGray}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.username}
                    onChangeText={(text) =>
                      setFormData({ ...formData, username: text })
                    }
                    placeholderTextColor={Colors.darkGray}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    editable={false}
                    placeholderTextColor={Colors.darkGray}
                  />
                  <Text style={styles.helperText}>Email cannot be changed</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.darkGray}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Date of Birth</Text>
                  <TouchableOpacity
                    style={styles.datePickerInput}
                    onPress={openDobPicker}
                  >
                    <Text style={[styles.datePickerInputText, !formData.dateOfBirth && styles.datePickerPlaceholder]}>
                      {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Select date of birth'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showDobPicker && (
                  <>
                    <DateTimePicker
                      value={Platform.OS === 'ios' ? (iosDobDraft || parseDateForPicker(formData.dateOfBirth) || today) : (parseDateForPicker(formData.dateOfBirth) || today)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={today}
                      onChange={(event, selectedDate) => {
                        if (Platform.OS === 'ios') {
                          if (selectedDate) {
                            setIosDobDraft(selectedDate);
                            setFormData({
                              ...formData,
                              dateOfBirth: toDateOnlyString(selectedDate),
                            });
                          }
                          return;
                        }

                        setShowDobPicker(false);
                        if (event.type === 'dismissed' || !selectedDate) {
                          return;
                        }
                        setFormData({
                          ...formData,
                          dateOfBirth: toDateOnlyString(selectedDate),
                        });
                      }}
                    />

                    {Platform.OS === 'ios' && (
                      <View style={styles.iosPickerActions}>
                        <TouchableOpacity style={styles.iosPickerActionButton} onPress={cancelDobSelection}>
                          <Text style={styles.iosPickerCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iosPickerActionButton} onPress={confirmDobSelection}>
                          <Text style={styles.iosPickerDoneText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Weight in kg</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.weight?.toString() || ''}
                    onChangeText={(text) =>
                      setFormData({ ...formData, weight: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                    placeholderTextColor={Colors.darkGray}
                  />
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => {
                    setIsEditing(false);
                    setShowDobPicker(false);
                    setIosDobDraft(null);
                    setFormData(buildFormData(user));
                  }}
                  disabled={loading}
                >
                  <Text style={styles.buttonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonSave, loading && styles.buttonDisabled]}
                  onPress={handleUpdateProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.buttonSaveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
            </View>

            {/* Delete Account Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning" size={28} color={Colors.error} />
                <View>
                  <Text style={styles.sectionTitle}>Delete Account</Text>
                  <Text style={styles.sectionSubtitle}>Permanently delete your account</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.logoutButton, sendingDeleteOtp && styles.buttonDisabled]}
                onPress={handleDeleteAccountPress}
                disabled={sendingDeleteOtp}
              >
                {sendingDeleteOtp ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Ionicons name="trash" size={20} color={Colors.error} />
                )}
                <Text style={styles.logoutButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>

            {/* Security Section */}
            <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={28} color={Colors.primary} />
            <View>
              <Text style={styles.sectionTitle}>Security</Text>
              <Text style={styles.sectionSubtitle}>Manage password</Text>
            </View>
          </View>

          {!showPasswordForm ? (
            <TouchableOpacity
              style={styles.securityButton}
              onPress={() => setShowPasswordForm(true)}
            >
              <Ionicons name="key" size={20} color={Colors.white} />
              <Text style={styles.securityButtonText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.lightGray} />
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.formCard}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={passwordData.currentPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, currentPassword: text })
                      }
                      secureTextEntry={!showPasswords.current}
                      placeholderTextColor={Colors.darkGray}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPasswords.current ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={Colors.darkGray}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={passwordData.newPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, newPassword: text })
                      }
                      secureTextEntry={!showPasswords.new}
                      placeholderTextColor={Colors.darkGray}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPasswords.new ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={Colors.darkGray}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={passwordData.confirmPassword}
                      onChangeText={(text) =>
                        setPasswordData({ ...passwordData, confirmPassword: text })
                      }
                      secureTextEntry={!showPasswords.confirm}
                      placeholderTextColor={Colors.darkGray}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPasswords.confirm ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={Colors.darkGray}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setShowPasswords({
                      current: false,
                      new: false,
                      confirm: false,
                    });
                  }}
                  disabled={loading}
                >
                  <Text style={styles.buttonCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonSave, loading && styles.buttonDisabled]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.buttonSaveText}>Change Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
            </View>

            {/* Logout Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={20} color={Colors.error} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
            </>
          )}
        </Animated.ScrollView>
      </SafeAreaView>

      <Modal
        visible={deleteOtpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingAccount) {
            setDeleteOtpModalVisible(false);
          }
        }}
      >
        <View style={styles.deleteOtpOverlay}>
          <View style={styles.deleteOtpModalCard}>
            <Text style={styles.deleteOtpTitle}>Confirm Account Deletion</Text>
            <Text style={styles.deleteOtpSubtitle}>
              Enter the OTP sent to your email to permanently delete your account.
            </Text>

            <TextInput
              style={styles.deleteOtpInput}
              value={deleteOtp}
              onChangeText={(text) => setDeleteOtp(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={Colors.darkGray}
              maxLength={6}
            />

            <View style={styles.deleteOtpActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => {
                  if (!deletingAccount) {
                    setDeleteOtpModalVisible(false);
                    setDeleteOtp('');
                  }
                }}
                disabled={deletingAccount}
              >
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteConfirmButton, deletingAccount && styles.buttonDisabled]}
                onPress={verifyDeleteAccountOtp}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.buttonSaveText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 60,
  },
  header: {
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  profilePictureSection: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333333',
  },
  editIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.cardBackground,
  },
  profilePictureInfo: {
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  profileUsername: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  profilePictureActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  changePictureButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  changePictureText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  removePictureButton: {
    backgroundColor: 'rgba(196, 23, 23, 0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Poppins',
  },
  errorBanner: {
    backgroundColor: 'rgba(196, 23, 23, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.lightGray,
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  infoItem: {
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.lightGray,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: 'Poppins',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
  },
  editButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  formCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.white,
    borderWidth: 1,
    borderColor: '#333333',
    fontFamily: 'Poppins',
  },
  datePickerInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  datePickerInputText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  datePickerPlaceholder: {
    color: Colors.darkGray,
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  iosPickerActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  iosPickerCancelText: {
    color: Colors.lightGray,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  iosPickerDoneText: {
    color: Colors.primary,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.white,
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 6,
    fontStyle: 'italic',
    fontFamily: 'Poppins',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonCancel: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonCancelText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  buttonSave: {
    backgroundColor: Colors.primary,
  },
  buttonSaveText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  securityButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  securityButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  logoutButton: {
    backgroundColor: 'rgba(196, 23, 23, 0.12)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '700',
    flex: 1,
  },
  deleteOtpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteOtpModalCard: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#333333',
  },
  deleteOtpTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  deleteOtpSubtitle: {
    color: Colors.lightGray,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
    fontFamily: 'Poppins',
  },
  deleteOtpInput: {
    marginTop: 14,
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.white,
    borderWidth: 1,
    borderColor: '#333333',
    fontFamily: 'Poppins',
    letterSpacing: 2,
  },
  deleteOtpActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  deleteConfirmButton: {
    backgroundColor: Colors.error,
  },
});
