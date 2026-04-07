import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Modal,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Linking,
  RefreshControl,
} from 'react-native';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import Animated from 'react-native-reanimated';
import { useLiquidTabBarScrollHandler } from '@/components/shared/tabBarVisibility';

interface Trainer {
  _id: string;
  name: string;
  type: string;
  description?: string;
  bio?: string;
  about?: string;
  trainerDescription?: string;
  experience: number;
  rate: number;
  phone: string;
  certification?: any;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    x?: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Session {
  _id: string;
  type: string;
  description?: string;
  time: string;
  duration: number;
  rate: number;
  maxCapacity: number;
  dayOfWeek?: string;
  phone?: string;
  isActive: boolean;
  bookingCount?: number;
  isFull?: boolean;
  createdAt: string;
}

interface ActiveBooking {
  _id: string;
  type: 'trainer' | 'session';
  name: string;
  subtitle: string;
  rate: number;
  phone: string;
  bookedAt: string;
}

export default function BookingScreen() {
  const { token } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set()); // Track booked item IDs
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [certImagePreview, setCertImagePreview] = useState<string | null>(null);
  const [certImageLoading, setCertImageLoading] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCertPreview, setShowCertPreview] = useState(false);
  const scrollHandler = useLiquidTabBarScrollHandler();

  const getTrainerDescription = (trainer?: Trainer | null) => {
    if (!trainer) return 'No description available for this trainer.';
    const description = (trainer.description || trainer.trainerDescription || trainer.bio || trainer.about || '').trim();
    return description || 'No description available for this trainer.';
  };

  const resolveCertificateUrl = (certPath: string) => {
    const normalizedPath = certPath.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }
    return `${API_URL}/${normalizedPath}`;
  };

  const isLikelyImageUrl = (url: string) => {
    const cleanUrl = url.split('?')[0].toLowerCase();
    return /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/.test(cleanUrl);
  };

  // Clean up expired bookings from activeBookings and bookedIds
  useEffect(() => {
    const cleanupExpiredBookings = () => {
      const now = new Date().getTime();
      const activeBookingsData = activeBookings.filter((booking) => {
        const bookingStart = new Date(booking.bookedAt).getTime();
        const bookingEnd = bookingStart + 30 * 24 * 60 * 60 * 1000; // 30 days
        const daysLeft = Math.ceil((bookingEnd - now) / (1000 * 60 * 60 * 24));
        return daysLeft > 0;
      });

      // Update bookedIds to remove expired bookings
      const expiredIds = new Set(activeBookings
        .filter((booking) => {
          const bookingStart = new Date(booking.bookedAt).getTime();
          const bookingEnd = bookingStart + 30 * 24 * 60 * 60 * 1000;
          const daysLeft = Math.ceil((bookingEnd - now) / (1000 * 60 * 60 * 24));
          return daysLeft <= 0;
        })
        .map(b => b._id));

      if (expiredIds.size > 0) {
        setBookedIds(prev => {
          const newSet = new Set(prev);
          expiredIds.forEach(id => newSet.delete(id));
          return newSet;
        });
        setActiveBookings(activeBookingsData);
      }
    };

    cleanupExpiredBookings();
    
    // Check every minute for expired bookings
    const interval = setInterval(cleanupExpiredBookings, 60000);
    return () => clearInterval(interval);
  }, [activeBookings]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch trainers and sessions
      try {
        const [trainersResult, sessionsResult] = await Promise.allSettled([
          axios.get(`${API_URL}/trainer/all`),
          axios.get(`${API_URL}/session/all`),
        ]);

        let trainersLoaded = false;
        let sessionsLoaded = false;
        let trainerError = '';
        let sessionError = '';

        if (trainersResult.status === 'fulfilled') {
          const trainersRes = trainersResult.value;
          if (trainersRes.data.success) {
            const normalizedTrainers: Trainer[] = trainersRes.data.trainers
              .filter((t: Trainer) => t.isActive)
              .map((t: any) => ({
                ...t,
                description: (t.description || t.trainerDescription || t.bio || t.about || '').trim(),
              }));
            setTrainers(normalizedTrainers);
            trainersLoaded = true;
          } else {
            trainerError = trainersRes.data?.message || 'Failed to fetch trainers';
            console.error('Trainers response error:', trainersRes.data);
          }
        } else {
          trainerError = trainersResult.reason?.response?.data?.message || trainersResult.reason?.message || 'Failed to fetch trainers';
          console.error('Error fetching trainers:', trainersResult.reason);
        }

        if (sessionsResult.status === 'fulfilled') {
          const sessionsRes = sessionsResult.value;
          if (sessionsRes.data.success) {
            // Filter out full sessions
            setSessions(sessionsRes.data.sessions.filter((s: Session) => s.isActive && !s.isFull));
            sessionsLoaded = true;
          } else {
            sessionError = sessionsRes.data?.message || 'Failed to fetch sessions';
            console.error('Sessions response error:', sessionsRes.data);
          }
        } else {
          sessionError = sessionsResult.reason?.response?.data?.message || sessionsResult.reason?.message || 'Failed to fetch sessions';
          console.error('Error fetching sessions:', sessionsResult.reason);
        }

        if (!trainersLoaded && !sessionsLoaded) {
          const combinedError = [trainerError, sessionError].filter(Boolean).join(' | ');
          setError(`Failed to load booking data: ${combinedError || 'Server error'}`);
          setLoading(false);
          return;
        }

        // If only one endpoint fails, keep page usable and show a non-blocking message.
        if (!trainersLoaded || !sessionsLoaded) {
          const partialError = [trainerError, sessionError].filter(Boolean).join(' | ');
          setError(partialError || 'Some booking data could not be loaded');
        }

      } catch (mainErr: any) {
        const detailedMsg = mainErr?.response?.data?.message || mainErr?.message || 'Server error';
        console.error('Error fetching trainers/sessions:', detailedMsg);
        setError(`Failed to load booking data: ${detailedMsg}`);
        setLoading(false);
        return;
      }
      
      // Fetch bookings separately - don't let it break the whole flow
      try {
        if (token) {
          // Build the authorization header - ensure it's in correct format
          const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
          
          const bookingsRes = await axios.get(`${API_URL}/booking/my-bookings`, {
            headers: { 
              Authorization: authHeader
            }
          });
          
          if (bookingsRes.data.success) {
            const validBookings = bookingsRes.data.bookings.filter((b: any) => {
              const expiresAt = new Date(b.expiresAt);
              return expiresAt > new Date(); // Only keep non-expired
            });
            
            // Convert bookings to ActiveBooking interface
            const activeBookingsData: ActiveBooking[] = validBookings.map((b: any) => ({
              _id: b.trainerId || b.sessionId,
              type: b.type,
              name: b.type === 'trainer' ? b.trainerName : b.sessionType,
              subtitle: b.type === 'trainer' ? b.trainerType : `${b.sessionTime} - ${b.sessionDuration} min`,
              rate: b.type === 'trainer' ? b.trainerRate : b.sessionRate,
              phone: b.type === 'trainer' ? b.trainerPhone : (b.sessionPhone || ''),
              bookedAt: b.bookedAt,
            }));
            
            setActiveBookings(activeBookingsData);
            
            // Create set of booked IDs for quick lookup
            const bookedSet: Set<string> = new Set(validBookings.map((b: any) => b.trainerId || b.sessionId));
            setBookedIds(bookedSet);
          }
        } else {
          console.log('No token available for bookings request');
        }
      } catch (bookingErr: any) {
        console.error('Error fetching bookings:', bookingErr.response?.status, bookingErr.message);
        // Don't show error for bookings, just continue without them
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load trainers and sessions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleTrainerClick = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowTrainerModal(true);
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const closeTrainerModal = () => {
    setShowTrainerModal(false);
    setSelectedTrainer(null);
    setShowCertPreview(false);
    setCertImagePreview(null);
    setCertImageLoading(false);
  };

  const closeSessionModal = () => {
    setShowSessionModal(false);
    setSelectedSession(null);
  };

  const handleViewCertification = async () => {
    if (selectedTrainer?.certification) {
      const certPath = typeof selectedTrainer.certification === 'string' 
        ? selectedTrainer.certification 
        : selectedTrainer.certification?.url || selectedTrainer.certification?.path || '';
      if (certPath) {
        const certUrl = resolveCertificateUrl(certPath);

        // If certificate is not an image (e.g., PDF), open it externally.
        if (!isLikelyImageUrl(certUrl)) {
          try {
            await Linking.openURL(certUrl);
          } catch (openErr) {
            console.error('Error opening certificate URL:', openErr);
            setError('Unable to open certification file.');
          }
          return;
        }

        // Keep trainer popup open while showing certification preview.
        setCertImageLoading(true);
        setCertImagePreview(certUrl);
        setShowCertPreview(true);
      }
    }
  };

  const closeCertPreview = () => {
    setShowCertPreview(false);
    setCertImagePreview(null);
    setCertImageLoading(false);
  };

  const handleSocialMediaClick = async (url: string) => {
    if (!url || url.trim() === '') return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.log('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening social media URL:', error);
    }
  };

  const initiateBookingPayment = async (payload: {
    type: 'trainer' | 'session';
    trainerId?: string;
    sessionId?: string;
  }) => {
    if (!token) return;

    try {
      const appRedirectUrl = ExpoLinking.createURL('/payment-callback');
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await axios.post(
        `${API_URL}/booking/khalti/initiate`,
        {
          ...payload,
          returnUrl: `${API_URL}/payment/khalti/redirect?deeplink=${encodeURIComponent(appRedirectUrl)}`,
        },
        { headers: { Authorization: authHeader } }
      );

      if (response.data.success && response.data.paymentUrl) {
        const result = await WebBrowser.openAuthSessionAsync(
          response.data.paymentUrl,
          appRedirectUrl
        );

        if (result.type === 'success' && result.url) {
          // Ensure detail popups are closed when returning after successful payment.
          setShowTrainerModal(false);
          setShowSessionModal(false);
          setSelectedTrainer(null);
          setSelectedSession(null);
          await ExpoLinking.openURL(result.url);
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          setError('Payment was cancelled.');
        }
      }
    } catch (err: any) {
      console.error('Error initiating booking payment:', err);
      setError(err.response?.data?.message || 'Failed to start payment');
    }
  };

  const handleBookTrainer = async () => {
    if (!selectedTrainer) return;
    await initiateBookingPayment({
      type: 'trainer',
      trainerId: selectedTrainer._id,
    });
  };

  const handleBookSession = async () => {
    if (!selectedSession) return;
    await initiateBookingPayment({
      type: 'session',
      sessionId: selectedSession._id,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book Trainers & Sessions</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#dc3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Active Bookings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Active Bookings</Text>
          {activeBookings.length === 0 ? (
            <View style={styles.emptyBookingState}>
              <Ionicons name="bookmark-outline" size={40} color={Colors.darkGray} />
              <Text style={styles.emptyBookingText}>No bookings yet. Book a trainer or session to get started!</Text>
            </View>
          ) : (
            activeBookings.map((booking) => {
              const bookingStart = new Date(booking.bookedAt).getTime();
              const bookingEnd = bookingStart + 30 * 24 * 60 * 60 * 1000; // 30 days
              const daysLeft = Math.ceil((bookingEnd - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const totalBookingDays = 30;
              
              return (
                <View key={booking._id} style={styles.bookingCard}>
                  <View style={styles.bookingTypeContainer}>
                    <View style={styles.bookingTypeIcon}>
                      <Ionicons 
                        name={booking.type === 'trainer' ? 'person-outline' : 'calendar-outline'} 
                        size={16} 
                        color={Colors.primary} 
                      />
                    </View>
                    <View style={styles.bookingCardContent}>
                      <Text style={styles.bookingTitle}>{booking.name}</Text>
                      {booking.subtitle && <Text style={styles.bookingSubtitle}>{booking.subtitle}</Text>}
                      {booking.phone && (
                        <Text style={styles.bookingPhone}>{booking.phone}</Text>
                      )}
                    </View>
                    <View style={styles.daysLeftBadge}>
                      <Text style={styles.daysLeftText}>{daysLeft} days left</Text>
                    </View>
                  </View>
                  <View style={styles.bookingMeta}>
                    <Text style={styles.bookingMetaText}>
                      {totalBookingDays} days of booking • Rs. {booking.rate}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Monthly Booking Note */}
          <View style={styles.bookingNoteSection}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} />
            <Text style={styles.bookingNoteText}>Bookings are valid for 1 month from the date booked.</Text>
          </View>
        </View>

        {/* Trainers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Trainers</Text>
          {trainers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={40} color={Colors.darkGray} />
              <Text style={styles.emptyText}>No trainers available</Text>
            </View>
          ) : (
            trainers.map((trainer) => (
              <View key={trainer._id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTitle}>{trainer.name}</Text>
                    <Text style={styles.cardSubtitle}>{trainer.type}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Ionicons name="barbell" size={14} color={Colors.primary} />
                        <Text style={styles.badgeText}>{trainer.experience} yrs</Text>
                      </View>
                      <View style={styles.badge}>
                        <Ionicons name="cash" size={14} color={Colors.primary} />
                        <Text style={styles.badgeText}>Rs. {trainer.rate}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleTrainerClick(trainer)}
                  >
                    <Text style={styles.bookButtonText}>{bookedIds.has(trainer._id) ? 'View' : 'Book Now'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sessions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Sessions</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color={Colors.darkGray} />
              <Text style={styles.emptyText}>No sessions available</Text>
            </View>
          ) : (
            sessions.map((session) => (
              <View key={session._id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardDetails}>
                    <Text style={styles.cardTitle}>{session.type}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Ionicons name="time" size={14} color={Colors.primary} />
                        <Text style={styles.badgeText}>{session.time}</Text>
                      </View>
                      <View style={styles.badge}>
                        <Ionicons name="hourglass" size={14} color={Colors.primary} />
                        <Text style={styles.badgeText}>{session.duration} min</Text>
                      </View>
                      <View style={styles.badge}>
                        <Ionicons name="cash" size={14} color={Colors.primary} />
                        <Text style={styles.badgeText}>Rs. {session.rate}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleSessionClick(session)}
                  >
                    <Text style={styles.bookButtonText}>{bookedIds.has(session._id) ? 'View' : 'Book Now'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </Animated.ScrollView>

      {/* Trainer Detail Modal */}
      <Modal
        visible={showTrainerModal}
        transparent
        animationType="fade"
        onRequestClose={closeTrainerModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeTrainerModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trainer Details</Text>
              <TouchableOpacity
                onPress={closeTrainerModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedTrainer && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>{selectedTrainer.name}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Specialization</Text>
                    <Text style={styles.detailValue}>{selectedTrainer.type}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{getTrainerDescription(selectedTrainer)}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Experience</Text>
                    <Text style={styles.detailValue}>{selectedTrainer.experience} years</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Rate per Session</Text>
                    <Text style={styles.detailValue}>Rs. {selectedTrainer.rate}</Text>
                  </View>

                  {selectedTrainer?.certification ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Certification</Text>
                      <TouchableOpacity
                        style={styles.certButton}
                        onPress={handleViewCertification}
                      >
                        <Text style={styles.certButtonText}>View Certification</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedTrainer?.socialMedia?.instagram || selectedTrainer?.socialMedia?.facebook || selectedTrainer?.socialMedia?.x ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Follow</Text>
                      <View style={styles.socialLinksRow}>
                        {selectedTrainer.socialMedia?.instagram && <TouchableOpacity
                          style={styles.socialIcon}
                          activeOpacity={0.7}
                          onPress={() => handleSocialMediaClick(selectedTrainer.socialMedia?.instagram || '')}
                        >
                          <Ionicons name="logo-instagram" size={24} color={Colors.primary} />
                        </TouchableOpacity>}
                        {selectedTrainer.socialMedia?.facebook && <TouchableOpacity
                          style={styles.socialIcon}
                          activeOpacity={0.7}
                          onPress={() => handleSocialMediaClick(selectedTrainer.socialMedia?.facebook || '')}
                        >
                          <Ionicons name="logo-facebook" size={24} color={Colors.primary} />
                        </TouchableOpacity>}
                        {selectedTrainer.socialMedia?.x && <TouchableOpacity
                          style={styles.socialIcon}
                          activeOpacity={0.7}
                          onPress={() => handleSocialMediaClick(selectedTrainer.socialMedia?.x || '')}
                        >
                          <Ionicons name="logo-twitter" size={24} color={Colors.primary} />
                        </TouchableOpacity>}
                      </View>
                    </View>
                  ) : null}
                </>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeTrainerModal}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              {!bookedIds.has(selectedTrainer?._id || '') && (
                <TouchableOpacity style={styles.submitButton} onPress={handleBookTrainer}>
                  <Text style={styles.submitButtonText}>Book Now</Text>
                </TouchableOpacity>
              )}
            </View>
            </View>
          </TouchableWithoutFeedback>

          {showCertPreview && (
            <View style={styles.certInlineOverlay}>
              <TouchableWithoutFeedback onPress={closeCertPreview}>
                <View style={styles.certInlineBackdrop} />
              </TouchableWithoutFeedback>
              <View style={styles.certPreviewContainer}>
                <TouchableOpacity
                  style={styles.certCloseButton}
                  onPress={closeCertPreview}
                >
                  <Ionicons name="close-circle" size={40} color={Colors.primary} />
                </TouchableOpacity>
                {certImageLoading && (
                  <View style={styles.certLoadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                  </View>
                )}
                {certImagePreview && typeof certImagePreview === 'string' && certImagePreview.trim() ? (
                  <Image
                    source={{ uri: certImagePreview }}
                    style={styles.certImage}
                    resizeMode="contain"
                    onLoadEnd={() => setCertImageLoading(false)}
                    onError={(error) => {
                      console.error('Image load error:', error);
                      setCertImageLoading(false);
                      setError('Unable to load certification image.');
                      closeCertPreview();
                    }}
                  />
                ) : null}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Session Detail Modal */}
      <Modal
        visible={showSessionModal}
        transparent
        animationType="fade"
        onRequestClose={closeSessionModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeSessionModal}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Details</Text>
              <TouchableOpacity
                onPress={closeSessionModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedSession && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{selectedSession.type}</Text>
                  </View>

                  {selectedSession.description ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailValue}>{selectedSession.description}</Text>
                    </View>
                  ) : null}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{selectedSession.time}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{selectedSession.duration} minutes</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>Rs. {selectedSession.rate}</Text>
                  </View>

                  {selectedSession.dayOfWeek && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Day</Text>
                      <Text style={styles.detailValue}>{selectedSession.dayOfWeek}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeSessionModal}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              {!bookedIds.has(selectedSession?._id || '') && (
                <TouchableOpacity style={styles.submitButton} onPress={handleBookSession}>
                  <Text style={styles.submitButtonText}>Book Now</Text>
                </TouchableOpacity>
              )}
            </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 24,
    marginTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    flex: 1,
    fontFamily: 'Poppins',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 14,
    fontFamily: 'Poppins',
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.lightGray,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 122, 37, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
  emptyBookingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.2)',
  },
  emptyBookingText: {
    fontSize: 14,
    color: Colors.lightGray,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  // Modal Styles
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
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailSection: {
    marginBottom: 18,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 22,
  },
  certButton: {
    paddingVertical: 8,
    marginTop: 6,
  },
  certButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  socialLinksRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 122, 37, 0.3)',
  },
  activeCard: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#28a745',
    marginBottom: 12,
    overflow: 'hidden',
  },
  activeCardHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeCardContent: {
    flex: 1,
    marginRight: 12,
  },
  activeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  activeCardSubtitle: {
    fontSize: 13,
    color: Colors.lightGray,
    marginBottom: 8,
  },
  phoneSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(40, 167, 69, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  contactPhone: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  activeCardRight: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#333333',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.lightGray,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  // Certification Preview
  certPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  certInlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 20,
  },
  certInlineBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  certCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  certImage: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
  },
  certLoadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
  },
  noCertText: {
    fontSize: 16,
    color: Colors.lightGray,
    textAlign: 'center',
  },
  bookingNoteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(229, 122, 37, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 122, 37, 0.2)',
  },
  bookingNoteText: {
    fontSize: 13,
    color: Colors.lightGray,
    flex: 1,
    lineHeight: 18,
  },
  bookingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 122, 37, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookingCardContent: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  bookingSubtitle: {
    fontSize: 12,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
  bookingPhone: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  daysLeftBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: 'Poppins',
  },
  bookingMeta: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  bookingMetaText: {
    fontSize: 11,
    color: Colors.lightGray,
    fontFamily: 'Poppins',
  },
});
