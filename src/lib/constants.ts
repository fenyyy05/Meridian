export const APP_NAME = 'Meridian'
export const APP_TAGLINE = 'Find your direction. Make your time count.'

export const ACADEMIC_LEVELS = [
  { value: 'HIGH_SCHOOL', label: 'High School' },
  { value: 'UNDERGRADUATE', label: 'Undergraduate' },
  { value: 'GRADUATE', label: 'Graduate' },
  { value: 'PROFESSIONAL', label: 'Professional' },
] as const

export const TASK_STATUSES = [
  { value: 'TODO', label: 'To Do', color: '#A7C4D4' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#B8A9C9' },
  { value: 'COMPLETED', label: 'Completed', color: '#B5C9B3' },
  { value: 'POSTPONED', label: 'Postponed', color: '#E8C4C4' },
] as const

export const DIFFICULTY_LEVELS = [
  { value: 1, label: 'Very Easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Hard' },
  { value: 5, label: 'Very Hard' },
] as const

export const PRIORITY_LEVELS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Below Normal' },
  { value: 3, label: 'Normal' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Critical' },
] as const

export const FOCUS_DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 25, label: '25 min' },
  { value: 45, label: '45 min' },
  { value: 50, label: '50 min' },
] as const

export const DISTRACTION_CATEGORIES = [
  { value: 'SOCIAL_MEDIA', label: 'Social Media', icon: 'Smartphone' },
  { value: 'YOUTUBE', label: 'YouTube', icon: 'Youtube' },
  { value: 'MESSAGING', label: 'Messaging', icon: 'MessageCircle' },
  { value: 'GAMING', label: 'Gaming', icon: 'Gamepad2' },
  { value: 'NOTIFICATIONS', label: 'Notifications', icon: 'Bell' },
  { value: 'ENVIRONMENT', label: 'Environment', icon: 'Volume2' },
  { value: 'TAB_SWITCH', label: 'Tab Switch', icon: 'Monitor' },
  { value: 'OTHER', label: 'Other', icon: 'MoreHorizontal' },
] as const

export const RESOURCE_TYPES = [
  { value: 'ARTICLE', label: 'Article', icon: 'FileText' },
  { value: 'VIDEO', label: 'Video', icon: 'Video' },
  { value: 'NOTES', label: 'Notes', icon: 'StickyNote' },
  { value: 'DOCUMENTATION', label: 'Documentation', icon: 'BookOpen' },
  { value: 'PRACTICE_PROBLEMS', label: 'Practice Problems', icon: 'Code' },
  { value: 'QUESTION_SET', label: 'Question Set', icon: 'HelpCircle' },
] as const

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100] as const

export const SUBJECT_COLORS = [
  '#B8A9C9', // lavender
  '#A7C4D4', // blue  
  '#B5C9B3', // sage
  '#E8C4C4', // pink
  '#D4C5A9', // gold
  '#C4B8D4', // purple
  '#A9C4B8', // teal
  '#D4A9A9', // rose
] as const

export const MIN_FOCUS_MINUTES_FOR_STREAK = 10
export const MIN_DAILY_FOCUS_THRESHOLD = 15
export const ML_MINIMUM_SESSIONS = 5
export const DEFAULT_BREAK_DURATION = 5
