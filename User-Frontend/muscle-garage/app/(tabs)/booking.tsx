import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Linking,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

interface Trainer {
  _id: string;
  name: string;
  type: string;
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

  // Modal states
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [certImagePreview, setCertImagePreview] = useState<string | null>(null);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCertPreview, setShowCertPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch trainers and sessions
      try {
        const [trainersRes, sessionsRes] = await Promise.all([
          axios.get(`${API_URL}/trainer/all`),
          axios.get(`${API_URL}/session/all`),
        ]);

        if (trainersRes.data.success) {
          setTrainers(trainersRes.data.trainers.filter((t: Trainer) => t.isActive));
        } else {
          console.error('Trainers response error:', trainersRes.data);
        }
        
        if (sessionsRes.data.success) {
          // Filter out full sessions
          setSessions(sessionsRes.data.sessions.filter((s: Session) => s.isActive && !s.isFull));
        } else {
          console.error('Sessions response error:', sessionsRes.data);
        }
      } catch (mainErr: any) {
        console.error('Error fetching trainers/sessions:', mainErr.message);
        setError(`Failed to load: ${mainErr.message}`);
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
  };

  const handleTrainerClick = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowTrainerModal(true);
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionModal(true);
  };

  const handleViewCertification = () => {
    if (selectedTrainer?.certification) {
      const certPath = typeof selectedTrainer.certification === 'string' 
        ? selectedTrainer.certification 
        : selectedTrainer.certification?.url || selectedTrainer.certification?.path || '';
      if (certPath) {
        setCertImagePreview(certPath);
        setShowCertPreview(true);
      }
    }
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

  const handleBookTrainer = async () => {
    if (!selectedTrainer) return;
    try {
      // Save to API
      const response = await axios.post(
        `${API_URL}/booking/create`,
        {
          trainerId: selectedTrainer._id,
          type: 'trainer',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Add to active bookings locally
        const newBooking: ActiveBooking = {
          _id: selectedTrainer._id,
          type: 'trainer',
          name: selectedTrainer.name,
          subtitle: selectedTrainer.type,
          rate: selectedTrainer.rate,
          phone: selectedTrainer.phone,
          bookedAt: new Date().toISOString(),
        };
        setActiveBookings([...activeBookings, newBooking]);
        setBookedIds(new Set([...bookedIds, selectedTrainer._id]));
        setShowTrainerModal(false);
        setError('');
      }
    } catch (err: any) {
      console.error('Error booking trainer:', err);
      if (err.response?.status === 400 && err.response?.data?.message === 'Already booked') {
        // Already booked, just close modal
        setShowTrainerModal(false);
      } else {
        setError(err.response?.data?.message || 'Failed to book trainer');
      }
    }
  };

  const handleBookSession = async () => {
    if (!selectedSession) return;
    try {
      // Save to API
      const response = await axios.post(
        `${API_URL}/booking/create`,
        {
          sessionId: selectedSession._id,
          type: 'session',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Add to active bookings locally
        const newBooking: ActiveBooking = {
          _id: selectedSession._id,
          type: 'session',
          name: selectedSession.type,
          subtitle: `${selectedSession.time} - ${selectedSession.duration} min`,
          rate: selectedSession.rate,
          phone: selectedSession.phone || '',
          bookedAt: new Date().toISOString(),
        };
        setActiveBookings([...activeBookings, newBooking]);
        setBookedIds(new Set([...bookedIds, selectedSession._id]));
        setShowSessionModal(false);
        setError('');
      }
    } catch (err: any) {
      console.error('Error booking session:', err);
      if (err.response?.status === 400 && err.response?.data?.message === 'Already booked') {
        // Already booked, just close modal
        setShowSessionModal(false);
      } else {
        setError(err.response?.data?.message || 'Failed to book session');
      }
    }
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            activeBookings.map((booking) => (
              <View key={booking._id} style={styles.activeCard}>
                <View style={styles.activeCardHeader}>
                  <View style={styles.activeCardContent}>
                    <Text style={styles.activeCardTitle}>{booking.name}</Text>
                    <Text style={styles.activeCardSubtitle}>{booking.subtitle}</Text>
                    {booking.phone?.trim() && (
                      <View style={styles.phoneSection}>
                        <Ionicons name="call" size={16} color="#28a745" />
                        <Text style={styles.phoneText}>{booking.phone}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.activeCardRight}>
                    <Text style={styles.rateText}>Rs. {booking.rate}</Text>
                  </View>
                </View>
              </View>
            ))
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
      </ScrollView>

      {/* Trainer Detail Modal */}
      <Modal visible={showTrainerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trainer Details</Text>
              <TouchableOpacity
                onPress={() => setShowTrainerModal(false)}
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
                onPress={() => setShowTrainerModal(false)}
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
        </View>
      </Modal>

      {/* Session Detail Modal */}
      <Modal visible={showSessionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Details</Text>
              <TouchableOpacity
                onPress={() => setShowSessionModal(false)}
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
                onPress={() => setShowSessionModal(false)}
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
        </View>
      </Modal>

      {/* Certification Preview Modal */}
      <Modal visible={showCertPreview} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.certPreviewContainer}>
            <TouchableOpacity
              style={styles.certCloseButton}
              onPress={() => setShowCertPreview(false)}
            >
              <Ionicons name="close-circle" size={40} color={Colors.primary} />
            </TouchableOpacity>
            {certImagePreview && typeof certImagePreview === 'string' && certImagePreview.trim() ? (
              <Image
                source={{ 
                  uri: certImagePreview.startsWith('http') ? certImagePreview : `${API_URL}/${certImagePreview}`
                }}
                style={styles.certImage}
                resizeMode="contain"
                onError={(error) => {
                  console.error('Image load error:', error);
                  setShowCertPreview(false);
                }}
              />
            ) : null}
          </View>
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
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginTop:20
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
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 14,
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
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.lightGray,
    marginBottom: 8,
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
});
