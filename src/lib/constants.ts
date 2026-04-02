import type { EventType, LeadStatus, TaskStatus, TaskPriority, PostStatus } from '@/types/database'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  own_event: 'Eigenes Event',
  local_event: 'Lokales Event',
  holiday: 'Feiertag',
  concept_event: 'Konzept-Event',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  own_event: '#C5A572',
  local_event: '#3B82F6',
  holiday: '#EF4444',
  concept_event: '#8B5CF6',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  neu: 'Neu',
  kontaktiert: 'Kontaktiert',
  interessiert: 'Interessiert',
  gebucht: 'Gebucht',
  nachfassen: 'Nachfassen',
  verloren: 'Verloren',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  neu: '#6B7280',
  kontaktiert: '#3B82F6',
  interessiert: '#F59E0B',
  gebucht: '#10B981',
  nachfassen: '#8B5CF6',
  verloren: '#EF4444',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Offen',
  in_progress: 'In Arbeit',
  done: 'Erledigt',
  overdue: 'Überfällig',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  urgent: 'Dringend',
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: 'Entwurf',
  planned: 'Geplant',
  ready: 'Bereit',
  published: 'Veröffentlicht',
}

export const PLATFORM_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
} as const

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/kalender', label: 'Kalender', icon: 'Calendar' },
  { href: '/leads', label: 'Leads', icon: 'Users' },
  { href: '/konzepte', label: 'Konzepte', icon: 'Lightbulb' },
  { href: '/social', label: 'Social Media', icon: 'Share2' },
  { href: '/bewertungen', label: 'Bewertungen', icon: 'Star' },
  { href: '/einstellungen', label: 'Einstellungen', icon: 'Settings' },
] as const
