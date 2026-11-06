export type StudioPillar =
  | 'Dance'
  | 'Dance Fitness'
  | 'Fitness'
  | 'Wellness'
  | 'Sports & Movement'
  | 'Private & Rentals';

export type TargetGroup = 'Kids' | 'Juniors' | 'Teens' | 'Adults' | 'Individual' | 'All';

export interface StudioClassSlot {
  id: string;
  time: string; // e.g. "6:00 AM – 7:00 AM"
  activity: string; // e.g. "Yoga", "Kids Dance", "Boxing"
  pillar: StudioPillar;
  targetGroup: TargetGroup;
  targetDisplay?: string; // e.g. "Kids / Juniors", "Teens / Adults"
  days: ('Mon' | 'Wed' | 'Fri')[];
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

/**
 * Official Studio Class Days (Mon · Wed · Fri) as confirmed by Pavilion Studio Mogappair.
 * Tuesday, Thursday, Saturday & Sunday have no studio operations.
 */
export const DAYS_OF_WEEK = [
  { key: 'Mon', label: 'Monday', short: 'Mon', theme: 'Dance + Fitness' },
  { key: 'Wed', label: 'Wednesday', short: 'Wed', theme: 'Dance + Fitness' },
  { key: 'Fri', label: 'Friday', short: 'Fri', theme: 'Dance + Boxing + Fitness' },
] as const;

export type DayKey = (typeof DAYS_OF_WEEK)[number]['key'];

/**
 * Official Studio Master Class Schedule (Mon · Wed · Fri)
 * Calibrated 100% against official posters:
 * - Suggested hours: 6:00 AM – 10:00 PM
 * - Morning Movement, Day Slots, and Evening Sessions.
 */
export const STUDIO_SCHEDULE: StudioClassSlot[] = [
  // ----------------------------------------------------
  // 6:00 AM – 7:00 AM (Morning Movement)
  // ----------------------------------------------------
  {
    id: 'yoga-morning-mon-fri',
    time: '6:00 AM – 7:00 AM',
    activity: 'Yoga',
    pillar: 'Wellness',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Mon', 'Fri'],
    description: 'Restorative and energizing morning flow for physical vitality and mindful breath.',
  },
  {
    id: 'fitness-morning-wed',
    time: '6:00 AM – 7:00 AM',
    activity: 'Fitness',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Wed'],
    description: 'Midweek functional strength, core activation and dynamic conditioning.',
  },

  // ----------------------------------------------------
  // 7:00 AM – 8:00 AM (Morning Movement)
  // ----------------------------------------------------
  {
    id: 'fitness-morning-mon-fri',
    time: '7:00 AM – 8:00 AM',
    activity: 'Fitness',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Mon', 'Fri'],
    description: 'High-energy full-body functional strength conditioning and athletic mobility.',
  },
  {
    id: 'yoga-morning-wed',
    time: '7:00 AM – 8:00 AM',
    activity: 'Yoga',
    pillar: 'Wellness',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Wed'],
    description: 'Midweek deep stretch, alignment, mobility drills, and focused breathwork.',
  },

  // ----------------------------------------------------
  // 8:00 AM – 9:00 AM (Morning Movement)
  // ----------------------------------------------------
  {
    id: 'pt-morning-mwf',
    time: '8:00 AM – 9:00 AM',
    activity: 'Personal Training',
    pillar: 'Fitness',
    targetGroup: 'Individual',
    targetDisplay: 'Individual',
    days: ['Mon', 'Wed', 'Fri'],
    description: 'Dedicated 1-on-1 personalized goal coaching with master trainers.',
    badge: '1-on-1',
  },

  // ----------------------------------------------------
  // 9:00 AM – 4:00 PM (Day Slots)
  // ----------------------------------------------------
  {
    id: 'daytime-slots-mwf',
    time: '9:00 AM – 4:00 PM',
    activity: 'School / Private / PT Slots',
    pillar: 'Private & Rentals',
    targetGroup: 'Individual',
    targetDisplay: 'School / Private / PT',
    days: ['Mon', 'Wed', 'Fri'],
    description: 'Exclusive private floor booking for school programs, private rehearsals & 1-on-1 PT.',
    badge: 'Private Slots',
  },

  // ----------------------------------------------------
  // 4:00 PM – 5:00 PM (Evening Sessions)
  // ----------------------------------------------------
  {
    id: 'kids-dance-mwf-4-5',
    time: '4:00 PM – 5:00 PM',
    activity: 'Kids Dance',
    pillar: 'Dance',
    targetGroup: 'Kids',
    targetDisplay: 'Kids',
    days: ['Mon', 'Wed', 'Fri'],
    description: 'After-school foundation dance batch: rhythm, coordination, agility & creative choreography.',
    badge: 'Foundation',
  },

  // ----------------------------------------------------
  // 5:00 PM – 6:00 PM (Evening Sessions)
  // ----------------------------------------------------
  {
    id: 'dance-mon-5-6',
    time: '5:00 PM – 6:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Kids',
    targetDisplay: 'Kids / Juniors',
    days: ['Mon'],
    description: 'Dynamic urban choreography, musicality, and footwork drills for kids & juniors.',
  },
  {
    id: 'dance-wed-fri-5-6',
    time: '5:00 PM – 6:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Juniors',
    targetDisplay: 'Juniors',
    days: ['Wed', 'Fri'],
    description: 'Junior progressive dance routine: hip-hop, contemporary styles & stage synchronization.',
  },

  // ----------------------------------------------------
  // 6:00 PM – 7:00 PM (Evening Sessions)
  // ----------------------------------------------------
  {
    id: 'dance-teens-mon-wed-6-7',
    time: '6:00 PM – 7:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Teens',
    targetDisplay: 'Teens',
    days: ['Mon', 'Wed'],
    description: 'High-tempo teen choreography, freestyle routines, and performance-grade synchronization.',
  },
  {
    id: 'boxing-teens-fri-6-7',
    time: '6:00 PM – 7:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Teens',
    targetDisplay: 'Teens',
    days: ['Fri'],
    description: 'Teen boxing fundamentals: stance, rapid footwork, mitt drills & athletic endurance.',
    badge: 'Popular',
  },

  // ----------------------------------------------------
  // 7:00 PM – 8:00 PM (Evening Sessions)
  // ----------------------------------------------------
  {
    id: 'dance-fitness-mon-wed-7-8',
    time: '7:00 PM – 8:00 PM',
    activity: 'Dance Fitness',
    pillar: 'Dance Fitness',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Mon', 'Wed'],
    description: 'High-octane cardio dance workout burning 500+ calories to pumping global beats.',
    badge: 'Cardio Blast',
  },
  {
    id: 'dance-adults-fri-7-8',
    time: '7:00 PM – 8:00 PM',
    activity: 'Dance',
    pillar: 'Dance',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Fri'],
    description: 'Adult dance masterclass: expressive choreography, style techniques, and rhythm control.',
  },

  // ----------------------------------------------------
  // 8:00 PM – 9:00 PM (Evening Sessions)
  // ----------------------------------------------------
  {
    id: 'boxing-mon-8-9',
    time: '8:00 PM – 9:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Adults',
    targetDisplay: 'Teens / Adults',
    days: ['Mon'],
    description: 'Full-body combat conditioning: pad work, core strength, punch combinations & endurance.',
  },
  {
    id: 'boxing-wed-8-9',
    time: '8:00 PM – 9:00 PM',
    activity: 'Boxing',
    pillar: 'Sports & Movement',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Wed'],
    description: 'Midweek combat fitness: heavy bag work, explosive power drills & cardiovascular stamina.',
  },
  {
    id: 'dance-fitness-fri-8-9',
    time: '8:00 PM – 9:00 PM',
    activity: 'Dance Fitness',
    pillar: 'Dance Fitness',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Fri'],
    description: 'Friday night celebration sweat session: dynamic dance cardio & full-body toning.',
    badge: 'Friday Release',
  },

  // ----------------------------------------------------
  // 9:00 PM – 10:00 PM (Evening Sessions)
  // ----------------------------------------------------
  {
    id: 'pt-night-mwf-9-10',
    time: '9:00 PM – 10:00 PM',
    activity: 'Personal Training',
    pillar: 'Fitness',
    targetGroup: 'Adults',
    targetDisplay: 'Adults',
    days: ['Mon', 'Wed', 'Fri'],
    description: 'Late-night 1-on-1 athletic coaching, strength training, core stability & guided recovery.',
    badge: '1-on-1',
  },
];
