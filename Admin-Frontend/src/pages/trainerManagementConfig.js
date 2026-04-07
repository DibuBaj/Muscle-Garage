export const TRAINER_TYPES = [
  'Weight Lifting',
  'CrossFit',
  'Yoga',
  'Cardio',
  'Pilates',
  'Boxing',
  'Fitness',
  'Strength & Conditioning',
  'Personal Training',
  'Group Fitness',
];

export const SESSION_TYPES = [...TRAINER_TYPES];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const createInitialTrainerForm = () => ({
  name: '',
  type: '',
  description: '',
  experience: '',
  certification: null,
  phone: '',
  socialMedia: {
    instagram: '',
    facebook: '',
    x: '',
  },
  rate: '',
  isActive: true,
});

export const createInitialSessionForm = () => ({
  type: '',
  description: '',
  time: '',
  duration: '',
  rate: '',
  maxCapacity: '',
  dayOfWeek: '',
  phone: '',
  isActive: true,
});

export const mapTrainerToForm = (item = {}) => ({
  name: item.name || '',
  type: item.type || '',
  description: item.description || '',
  experience: item.experience || '',
  certification: null,
  phone: item.phone || '',
  socialMedia: {
    instagram: item.instagram || '',
    facebook: item.facebook || '',
    x: item.x || '',
  },
  rate: item.rate || '',
  isActive: item.isActive !== undefined ? item.isActive : true,
});

export const mapSessionToForm = (item = {}) => ({
  type: item.type || '',
  description: item.description || '',
  time: item.time || '',
  duration: item.duration || '',
  rate: item.rate || '',
  maxCapacity: item.maxCapacity || '',
  dayOfWeek: item.dayOfWeek || '',
  phone: item.phone || '',
  isActive: item.isActive !== undefined ? item.isActive : true,
});