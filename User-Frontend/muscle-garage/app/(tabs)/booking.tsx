// import React, { useMemo, useState } from 'react';
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import SubscriptionProgressBar from '@/components/subscription-progress-bar';
// import { Colors } from '@/constants/colors';

// interface Session {
//   id: string;
//   title: string;
//   type: string;
//   time: string;
//   durationMinutes: number;
//   durationDays: number;
//   price: number;
//   coach: string;
//   intensity: 'Low' | 'Medium' | 'High';
// }

// interface Trainer {
//   id: string;
//   name: string;
//   focus: string;
//   experienceYears: number;
//   price: number;
//   durationDays: number;
//   rating: number;
//   bio: string;
// }

// interface ActiveBooking {
//   id: string;
//   itemId: string;
//   kind: 'session' | 'trainer';
//   title: string;
//   subtitle: string;
//   price: number;
//   totalDays: number;
//   daysLeft: number;
//   meta?: Record<string, string | number>;
// }

// const SESSION_TEMPLATES: Session[] = [
//   {
//     id: 's1',
//     title: 'Powerlifting Fundamentals',
//     type: 'Powerlifting',
//     time: '6:00 AM',
//     durationMinutes: 75,
//     durationDays: 7,
//     price: 700,
//     coach: 'Arjun Verma',
//     intensity: 'High',
//   },
//   {
//     id: 's2',
//     title: 'Calisthenics Flow',
//     type: 'Calisthenics',
//     time: '5:00 PM',
//     durationMinutes: 60,
//     durationDays: 7,
//     price: 600,
//     coach: 'Maya Singh',
//     intensity: 'Medium',
//   },
//   {
//     id: 's3',
//     title: 'CrossFit Engine',
//     type: 'CrossFit',
//     time: '7:30 PM',
//     durationMinutes: 50,
//     durationDays: 7,
//     price: 650,
//     coach: 'Rohan Das',
//     intensity: 'High',
//   },
//   {
//     id: 's4',
//     title: 'Mobility & Recovery',
//     type: 'Mobility',
//     time: '8:00 AM',
//     durationMinutes: 45,
//     durationDays: 7,
//     price: 400,
//     coach: 'Sara Iyer',
//     intensity: 'Low',
//   },
// ];

// const TRAINER_TEMPLATES: Trainer[] = [
//   {
//     id: 't1',
//     name: 'Kabir Rao',
//     focus: 'Powerlifting',
//     experienceYears: 8,
//     price: 4800,
//     durationDays: 30,
//     rating: 4.9,
//     bio: 'Max strength cycles with safe form and progressive overload.',
//   },
//   {
//     id: 't2',
//     name: 'Ananya Pillai',
//     focus: 'Calisthenics',
//     experienceYears: 5,
//     price: 4500,
//     durationDays: 30,
//     rating: 4.8,
//     bio: 'Skill work for levers, handstands, and controlled bodyweight strength.',
//   },
//   {
//     id: 't3',
//     name: 'Neeraj Kapoor',
//     focus: 'CrossFit',
//     experienceYears: 6,
//     price: 4700,
//     durationDays: 30,
//     rating: 4.7,
//     bio: 'Hybrid conditioning blocks with smart scaling for beginners.',
//   },
// ];


// export default function BookingScreen() {
//   const [availableSessions, setAvailableSessions] = useState<Session[]>(SESSION_TEMPLATES);
//   const [availableTrainers, setAvailableTrainers] = useState<Trainer[]>(TRAINER_TEMPLATES);
//   const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);

//   const sessionMap = useMemo(() =>
//     SESSION_TEMPLATES.reduce<Record<string, Session>>((acc, cur) => {
//       acc[cur.id] = cur;
//       return acc;
//     }, {}),
//   []);

//   const trainerMap = useMemo(() =>
//     TRAINER_TEMPLATES.reduce<Record<string, Trainer>>((acc, cur) => {
//       acc[cur.id] = cur;
//       return acc;
//     }, {}),
//   []);

//   const handleBookSession = (session: Session) => {
//     setAvailableSessions(prev => prev.filter(item => item.id !== session.id));
//     setActiveBookings(prev => [
//       ...prev,
//       {
//         id: `active-${session.id}`,
//         itemId: session.id,
//         kind: 'session',
//         title: session.title,
//         subtitle: `${session.type} - ${session.time}`,
//         price: session.price,
//         totalDays: session.durationDays,
//         daysLeft: session.durationDays,
//         meta: {
//           coach: session.coach,
//           intensity: session.intensity,
//           duration: `${session.durationMinutes} mins`,
//         },
//       },
//     ]);
//   };

//   const handleBookTrainer = (trainer: Trainer) => {
//     setAvailableTrainers(prev => prev.filter(item => item.id !== trainer.id));
//     setActiveBookings(prev => [
//       ...prev,
//       {
//         id: `active-${trainer.id}`,
//         itemId: trainer.id,
//         kind: 'trainer',
//         title: trainer.name,
//         subtitle: `${trainer.focus} coach \u2022 1 month`,
//         price: trainer.price,
//         totalDays: trainer.durationDays,
//         daysLeft: trainer.durationDays,
//         meta: {
//           experience: `${trainer.experienceYears} yrs`,
//           rating: trainer.rating,
//         },
//       },
//     ]);
//   };


//   return (
//     <View style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Sessions & Trainers</Text>
//         </View>

//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Active Bookings</Text>
//             <Text style={styles.sectionHint}>{activeBookings.length ? '' : 'Nothing active yet'}</Text>
//           </View>

//           {activeBookings.length === 0 ? (
//             <View style={styles.emptyCard}>
//               <Ionicons name="calendar-outline" size={22} color={Colors.lightGray} />
//               <Text style={styles.emptyText}>No active bookings. Book a session or trainer to begin.</Text>
//             </View>
//           ) : (
//             activeBookings.map(item => (
//               <View key={item.id} style={styles.activeCard}>
//                 <View style={styles.activeHeader}>
//                   <View>
//                     <Text style={styles.cardTitle}>{item.title}</Text>
//                     <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
//                   </View>
//                   <View style={styles.chip}>
//                     <Ionicons name={item.kind === 'session' ? 'time' : 'person'} size={14} color={Colors.white} />
//                     <Text style={styles.chipText}>{item.kind === 'session' ? 'Session' : 'Trainer'}</Text>
//                   </View>
//                 </View>

//                 <View style={styles.metaRow}>
//                   {item.meta?.coach && (
//                     <View style={styles.metaBadge}>
//                       <Ionicons name="person" size={14} color={Colors.primary} />
//                       <Text style={styles.metaText}>{item.meta.coach}</Text>
//                     </View>
//                   )}
//                   {item.meta?.duration && (
//                     <View style={styles.metaBadge}>
//                       <Ionicons name="hourglass" size={14} color={Colors.primary} />
//                       <Text style={styles.metaText}>{item.meta.duration}</Text>
//                     </View>
//                   )}
//                   {item.meta?.intensity && (
//                     <View style={styles.metaBadge}>
//                       <Ionicons name="barbell" size={14} color={Colors.primary} />
//                       <Text style={styles.metaText}>Intensity: {item.meta.intensity}</Text>
//                     </View>
//                   )}
//                   {item.meta?.experience && (
//                     <View style={styles.metaBadge}>
//                       <Ionicons name="ribbon" size={14} color={Colors.primary} />
//                       <Text style={styles.metaText}>{item.meta.experience}</Text>
//                     </View>
//                   )}
//                   {item.meta?.rating && (
//                     <View style={styles.metaBadge}>
//                       <Ionicons name="star" size={14} color={Colors.primary} />
//                       <Text style={styles.metaText}>Rating: {item.meta.rating}</Text>
//                     </View>
//                   )}
//                 </View>

//                 <SubscriptionProgressBar daysLeft={item.daysLeft} totalDays={item.totalDays} />

//                 <View style={styles.footerRow}>
//                   <Text style={styles.price}>Rs. {item.price}</Text>
//                   <Text style={styles.daysLeft}>{item.daysLeft} day(s) remaining</Text>
//                 </View>
//               </View>
//             ))
//           )}
//         </View>

//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Available Sessions</Text>
//           </View>
//           {availableSessions.map(session => (
//             <View key={session.id} style={styles.card}>
//               <View style={styles.cardHeader}>
//                 <View>
//                   <Text style={styles.cardTitle}>{session.title}</Text>
//                   <Text style={styles.cardSubtitle}>{session.type} - {session.time}</Text>
//                 </View>
//                 <View style={styles.chip}>
//                   <Ionicons name="flame" size={14} color={Colors.white} />
//                   <Text style={styles.chipText}>{session.intensity}</Text>
//                 </View>
//               </View>

//               <View style={styles.metaRow}>
//                 <View style={styles.metaBadge}>
//                   <Ionicons name="person" size={14} color={Colors.primary} />
//                   <Text style={styles.metaText}>{session.coach}</Text>
//                 </View>
//                 <View style={styles.metaBadge}>
//                   <Ionicons name="time" size={14} color={Colors.primary} />
//                   <Text style={styles.metaText}>{session.durationMinutes} mins</Text>
//                 </View>
//                 <View style={styles.metaBadge}>
//                   <Ionicons name="calendar" size={14} color={Colors.primary} />
//                   <Text style={styles.metaText}>{session.durationDays}-day access</Text>
//                 </View>
//               </View>

//               <View style={styles.footerRow}>
//                 <Text style={styles.price}>Rs. {session.price}</Text>
//                 <TouchableOpacity style={styles.button} onPress={() => handleBookSession(session)}>
//                   <Text style={styles.buttonText}>Book Now</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ))}
//           {availableSessions.length === 0 && (
//             <View style={styles.emptyCard}>
//               <Ionicons name="checkmark-done" size={22} color={Colors.lightGray} />
//               <Text style={styles.emptyText}>All sessions are currently booked.</Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.section}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Available Trainers</Text>
//           </View>
//           {availableTrainers.map(trainer => (
//             <View key={trainer.id} style={styles.card}>
//               <View style={styles.cardHeader}>
//                 <View>
//                   <Text style={styles.cardTitle}>{trainer.name}</Text>
//                   <Text style={styles.cardSubtitle}>{trainer.focus} coach</Text>
//                 </View>
//                 <View style={styles.ratingChip}>
//                   <Ionicons name="star" size={14} color={Colors.primary} />
//                   <Text style={styles.ratingText}>{trainer.rating.toFixed(1)}</Text>
//                 </View>
//               </View>

//               <Text style={styles.bio}>{trainer.bio}</Text>

//               <View style={styles.metaRow}>
//                 <View style={styles.metaBadge}>
//                   <Ionicons name="barbell" size={14} color={Colors.primary} />
//                   <Text style={styles.metaText}>{trainer.experienceYears} yrs exp</Text>
//                 </View>
//                 <View style={styles.metaBadge}>
//                   <Ionicons name="calendar" size={14} color={Colors.primary} />
//                   <Text style={styles.metaText}>{trainer.durationDays}-day program</Text>
//                 </View>
//               </View>

//               <View style={styles.footerRow}>
//                 <Text style={styles.price}>Rs. {trainer.price}</Text>
//                 <TouchableOpacity style={styles.button} onPress={() => handleBookTrainer(trainer)}>
//                   <Text style={styles.buttonText}>Book Now</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ))}
//           {availableTrainers.length === 0 && (
//             <View style={styles.emptyCard}>
//               <Ionicons name="checkmark-done" size={22} color={Colors.lightGray} />
//               <Text style={styles.emptyText}>All trainers are booked right now.</Text>
//             </View>
//           )}
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   scrollContent: {
//     padding: 20,
//     paddingBottom: 40,
//   },
//   header: {
//     marginTop: 20,
//     marginBottom: 18,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: Colors.white,
//   },
//   subtitle: {
//     marginTop: 6,
//     fontSize: 14,
//     color: Colors.lightGray,
//   },
//   section: {
//     marginTop: 10,
//     marginBottom: 18,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: Colors.white,
//   },
//   sectionHint: {
//     fontSize: 12,
//     color: Colors.darkGray,
//   },
//   emptyCard: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: '#333333',
//     padding: 18,
//     gap: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   emptyText: {
//     color: Colors.lightGray,
//     fontSize: 14,
//     flex: 1,
//   },
//   card: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 16,
//     padding: 18,
//     borderWidth: 1,
//     borderColor: '#333333',
//     marginBottom: 12,
//   },
//   activeCard: {
//     backgroundColor: Colors.cardBackground,
//     borderRadius: 16,
//     padding: 18,
//     borderWidth: 1,
//     borderColor: Colors.primary,
//     marginBottom: 12,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   activeHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: Colors.white,
//   },
//   cardSubtitle: {
//     fontSize: 13,
//     color: Colors.lightGray,
//     marginTop: 4,
//   },
//   chip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#333333',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//   },
//   chipText: {
//     color: Colors.white,
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   ratingChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     backgroundColor: 'rgba(229, 122, 37, 0.12)',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: Colors.primary,
//   },
//   ratingText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   metaRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: 6,
//   },
//   metaBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#2E2E2E',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 10,
//   },
//   metaText: {
//     color: Colors.lightGray,
//     fontSize: 12,
//   },
//   bio: {
//     color: Colors.lightGray,
//     fontSize: 13,
//     lineHeight: 18,
//     marginTop: 6,
//   },
//   footerRow: {
//     marginTop: 14,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   price: {
//     color: Colors.white,
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   daysLeft: {
//     color: Colors.lightGray,
//     fontSize: 13,
//   },
//   button: {
//     backgroundColor: Colors.primary,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 12,
//   },
//   buttonText: {
//     color: Colors.white,
//     fontSize: 14,
//     fontWeight: '700',
//   },
// });
