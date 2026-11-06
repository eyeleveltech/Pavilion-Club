export type StudioPillar = 'Dance' | 'Dance Fitness' | 'Fitness' | 'Wellness' | 'Sports & Movement' | 'Private & Rentals';

export type TargetGroup = 'Kids' | 'Juniors' | 'Teens' | 'Adults' | 'Individual' | 'All';

export interface StudioClassSlot {
  id: string;
  time: string; // e.g. "6:00 AM – 7:00 AM"
  activity: string; // e.g. "Yoga", "Kids Dance", "Boxing"
  pillar: StudioPillar;
  targetGroup: TargetGroup;
  days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  description?: string;
  badge?: string;
}

export const STUDIO_PILLARS: { key: StudioPillar; label: string; number: string }[] = [
  { key: 'Dance', label: 'Dance', number: '01' },
  { key: 'Dance Fitness', label: 'Dance Fitness', number: '02' },
  { key: 'Fitness', label: 'Fitness', number: '03' },
  { key: 'Wellness', label: 'Wellness', number: '04' },
  { key: 'Sports & Movement', label: 'Sports & Movement', number: '05' },
  { key: 'Private & Rentals', label: 'Private & Rentals', number: '06' },
];

export const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Monday', short: 'Mon' },
  { key: 'Tue', label: 'Tuesday', short: 'Tue' },
  { key: 'Wed', label: 'Wednesday', short: 'Wed' },
  { key: 'Thu', label: 'Thursday', short: 'Thu' },
  { key: 'Fri', label: 'Friday', short: 'Fri' },
  { key: 'Sat', label: 'Saturday', short: 'Sat' },
  { key: 'Sun', label: 'Sunday', short: 'Sun' },
] as const;

export type DayKey = (typeof DAYS_OF_WEEK)[number]['key'];

/**
 * Official 7-Day Master Class Schedule as calibrated from Pavilion Club master sheet.
 */
export const STUDIO_SCHEDULE: StudioClassSlot[] = [
  // 6:00 AM – 7:00 AM
  {
    id: 'yoga-morning-1',
    time: '6:00 AM – 7:00 AM',
    activity: 'Yoga',
    pillar: 'Wellness',
    targetGroup: 'Adults',
    days: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'],
    description: 'Awaken body and mind with restorative and energizing morning flow.',
  },
  {
    id: 'fitness-morning-wed',
    time: '6:00 AM – 7:00 AM',
    activity: 'Fitness',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    days: ['Wed'],
    description: 'Midweek functional strength and mobility conditioning.',
  },

  // 7:00 AM – 8:00 AM
  {
    id: 'fitness-morning-1',
    time: '7:00 AM – 8:00 AM',
    activity: 'Fitness',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    days: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat', 'Sun'],
    description: 'Strength conditioning, HIIT, and endurance circuits.',
  },
  {
    id: 'yoga-morning-wed',
    time: '7:00 AM – 8:00 AM',
    activity: 'Yoga',
    pillar: 'Wellness',
    targetGroup: 'Adults',
    days: ['Wed'],
    description: 'Midweek deep stretch, core alignment, and breathwork.',
  },

  // 8:00 AM – 9:00 AM
  {
    id: 'pt-morning',
    time: '8:00 AM – 9:00 AM',
    activity: 'Personal Training',
    pillar: 'Fitness',
    targetGroup: 'Individual',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    description: '1-on-1 personalized goal coaching with master trainers.',
    badge: '1-on-1',
  },
  {
    id: 'kids-dance-weekend-morning',
    time: '8:00 AM – 9:00 AM',
    activity: 'Kids Dance',
    pillar: 'Dance',
    targetGroup: 'Kids',
    days: ['Sat', 'Sun'],
    description: 'Joyful movement, rhythm and beginner technique for little ones.',
  },

  // 9:00 AM – 4:00 PM (Weekday school/private; Weekend morning blocks)
  {
    id: 'weekday-daytime-slots',
    time: '9:00 AM – 4:00 PM',
    activity: 'School / Private / PT Slots',
    pillar: 'Private & Rentals',
    targetGroup: 'Individual',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    description: 'Exclusive studio bookings for school programs, private rehearsals & PT sessions.',
    badge: 'Private Bookings',
  },
  // Weekend Daytime Blocks
  {
    id: 'weekend-kids-dance-9-10',
    time: '9:00 AM – 10:00 AM',
    activity: 'Kids Dance',
    pillar: 'Dance',
    targetGroup: 'Kids',
    days: ['Sat', 'Sun'],
    description: 'Early weekend energy: creative dance & choreography fundamentals.',
  },
  {
    id: 'weekend-kids-dance-10-11',
    time: '10:00 AM – 11:00 AM',
    activity: 'Kids Dance',
    pillar: 'Dance',
    targetGroup: 'Kids',
    days: ['Sat'],
    description: 'Choreography batch for kids exploring diverse dance styles.',
  },
  {
    id: 'weekend-silambam-sun-10-11',
    time: '10:00 AM – 11:00 AM',
    activity: 'Silambam',
    pillar: 'Sports & Movement',
    targetGroup: 'Kids',
    days: ['Sun'],
    description: 'Traditional Tamil martial arts & stick rotation technique for kids.',
  },
  {
    id: 'weekend-silambam-sat-11-12',
    time: '11:00 AM – 12:00 PM',
    activity: 'Silambam',
    pillar: 'Sports & Movement',
    targetGroup: 'Kids',
    days: ['Sat'],
    description: 'Traditional stick rotation, discipline & footwork training for kids.',
  },
  {
    id: 'weekend-boxing-sun-11-12',
    time: '11:00 AM – 12:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Juniors',
    days: ['Sun'],
    description: 'Boxing stance, footwork, speed bag drills and safe sparring basics.',
  },
  {
    id: 'weekend-boxing-sat-12-1',
    time: '12:00 PM – 1:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Juniors',
    days: ['Sat'],
    description: 'Junior boxing training: athletic conditioning, reflexes and combos.',
  },
  {
    id: 'weekend-private-sat-1-3',
    time: '1:00 PM – 3:00 PM',
    activity: 'Private Training / Practice / Studio Rental',
    pillar: 'Private & Rentals',
    targetGroup: 'Individual',
    days: ['Sat'],
    description: 'Open studio rental for rehearsal, video shoots, or private coaching.',
    badge: 'Rental',
  },
  {
    id: 'weekend-private-sun-12-2',
    time: '12:00 PM – 2:00 PM',
    activity: 'Private Training / Practice',
    pillar: 'Private & Rentals',
    targetGroup: 'Individual',
    days: ['Sun'],
    description: 'Dedicated studio rehearsal space for member practices.',
    badge: 'Rehearsal',
  },
  {
    id: 'weekend-pt-sun-2-3',
    time: '2:00 PM – 3:00 PM',
    activity: 'Personal Training',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    days: ['Sun'],
    description: 'One-on-one customized fitness and conditioning session.',
  },
  {
    id: 'weekend-kids-dance-3-4',
    time: '3:00 PM – 4:00 PM',
    activity: 'Kids Dance',
    pillar: 'Dance',
    targetGroup: 'Kids',
    days: ['Sat', 'Sun'],
    description: 'Afternoon high-energy dance session for active children.',
  },

  // 4:00 PM – 5:00 PM
  {
    id: 'kids-dance-daily',
    time: '4:00 PM – 5:00 PM',
    activity: 'Kids Dance',
    pillar: 'Dance',
    targetGroup: 'Kids',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    description: 'After-school foundation dance batch: rhythm, agility and team routines.',
  },
  {
    id: 'weekend-dance-juniors-4-5',
    time: '4:00 PM – 5:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Juniors',
    days: ['Sat', 'Sun'],
    description: 'Intermediate dance choreography and dynamic routine development.',
  },

  // 5:00 PM – 6:00 PM
  {
    id: 'dance-kids-juniors-mwf',
    time: '5:00 PM – 6:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Juniors',
    days: ['Mon', 'Wed', 'Fri'],
    description: 'Urban hip-hop, contemporary & freestyle dance for kids & juniors.',
  },
  {
    id: 'silambam-kids-juniors-tt',
    time: '5:00 PM – 6:00 PM',
    activity: 'Silambam',
    pillar: 'Sports & Movement',
    targetGroup: 'Juniors',
    days: ['Tue', 'Thu'],
    description: 'Ancient martial art training: balance, precision stick drills & agility.',
  },
  {
    id: 'weekend-dance-teens-5-6',
    time: '5:00 PM – 6:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Teens',
    days: ['Sat', 'Sun'],
    description: 'Fast-paced teen choreography & performance-level dance sets.',
  },

  // 6:00 PM – 7:00 PM
  {
    id: 'dance-teens-mwf',
    time: '6:00 PM – 7:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Teens',
    days: ['Mon', 'Wed', 'Fri'],
    description: 'Teens progressive street dance, hip-hop, and synchronization.',
  },
  {
    id: 'boxing-teens-tt',
    time: '6:00 PM – 7:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Teens',
    days: ['Tue', 'Thu'],
    description: 'Youth boxing conditioning: heavy bag, mitt work, stance & footwork.',
  },
  {
    id: 'weekend-salsa-adults-6-7',
    time: '6:00 PM – 7:00 PM',
    activity: 'Salsa',
    pillar: 'Dance',
    targetGroup: 'Adults',
    days: ['Sat', 'Sun'],
    description: 'Weekend Latin rhythm: partner work, musicality, turns & social salsa flow.',
  },

  // 7:00 PM – 8:00 PM
  {
    id: 'dance-fitness-adults-mwf',
    time: '7:00 PM – 8:00 PM',
    activity: 'Dance Fitness',
    pillar: 'Dance Fitness',
    targetGroup: 'Adults',
    days: ['Mon', 'Wed', 'Fri'],
    description: 'High-octane cardio dance party burning 500+ calories to infectious beats.',
    badge: 'Popular',
  },
  {
    id: 'salsa-adults-tt',
    time: '7:00 PM – 8:00 PM',
    activity: 'Salsa',
    pillar: 'Dance',
    targetGroup: 'Adults',
    days: ['Tue', 'Thu'],
    description: 'Sensational Salsa & Bachata styling, body isolation and partner dancing.',
  },
  {
    id: 'weekend-dance-fitness-sat-sun-7-8',
    time: '7:00 PM – 8:00 PM',
    activity: 'Dance Fitness',
    pillar: 'Dance Fitness',
    targetGroup: 'Adults',
    days: ['Sat', 'Sun'],
    description: 'Saturday & Sunday night sweat session: dance cardio and core toning.',
  },

  // 8:00 PM – 9:00 PM
  {
    id: 'boxing-mw-8-9',
    time: '8:00 PM – 9:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Adults',
    days: ['Mon', 'Wed'],
    description: 'Full-body combat conditioning: pad work, core strength & endurance.',
  },
  {
    id: 'dance-fitness-tt-8-9',
    time: '8:00 PM – 9:00 PM',
    activity: 'Dance Fitness',
    pillar: 'Dance Fitness',
    targetGroup: 'Adults',
    days: ['Tue', 'Thu', 'Fri'],
    description: 'Late-evening cardio rhythm release for busy professionals.',
  },
  {
    id: 'boxing-sat-8-9',
    time: '8:00 PM – 9:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Adults',
    days: ['Sat'],
    description: 'Saturday night punch power, heavy-bag drill & stamina challenge.',
  },
  {
    id: 'special-workshop-sun-8-9',
    time: '8:00 PM – 9:00 PM',
    activity: 'Special Workshop',
    pillar: 'Sports & Movement',
    targetGroup: 'All',
    days: ['Sun'],
    description: 'Curated weekend guest masterclasses: Sound bath, Calisthenics, or Guest Choreographer.',
    badge: 'Weekly Feature',
  },

  // 9:00 PM – 10:00 PM
  {
    id: 'pt-night-weekdays',
    time: '9:00 PM – 10:00 PM',
    activity: 'Personal Training',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    description: 'Late night 1-on-1 athletic coaching, strength training and recovery.',
    badge: '1-on-1',
  },
  {
    id: 'open-practice-weekend-9-10',
    time: '9:00 PM – 10:00 PM',
    activity: 'Open Practice / PT',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    days: ['Sat', 'Sun'],
    description: 'Open studio floor for self-guided practice, floor stretching & member cooldown.',
  },
];

