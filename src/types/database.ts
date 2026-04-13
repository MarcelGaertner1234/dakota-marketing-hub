export type EventType = 'own_event' | 'local_event' | 'holiday' | 'concept_event'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type LeadType = 'verein' | 'firma' | 'privatperson' | 'behoerde' | 'medien'
export type LeadStatus = 'neu' | 'kontaktiert' | 'interessiert' | 'gebucht' | 'nachfassen' | 'verloren'
export type PlatformType = 'instagram' | 'facebook' | 'tiktok'
export type PostStatus = 'draft' | 'planned' | 'ready' | 'published'
export type StoryCategory = 'dish' | 'drink' | 'house' | 'crew' | 'location'
export type StoryStatus = 'draft' | 'published'

export interface TeamMember {
  id: string
  name: string
  role: string
  color: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Concept {
  id: string
  name: string
  slug: string
  description: string | null
  description_berndeutsch: string | null
  target_audience: string | null
  channels: string[] | null
  menu_description: string | null
  price_range: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  event_type: EventType
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  color: string | null
  concept_id: string | null
  recurrence: RecurrenceType
  recurrence_end_date: string | null
  parent_event_id: string | null
  lead_time_days: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  concept?: Concept | null
  tasks?: Task[]
  images?: EventImage[]
}

export interface Task {
  id: string
  event_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  due_date: string | null
  completed_at: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  assigned_member?: TeamMember | null
  event?: Event | null
}

export interface EventImage {
  id: string
  event_id: string
  storage_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  caption: string | null
  is_cover: boolean
  sort_order: number
  uploaded_by: string | null
  created_at: string
}

export type LeadTemperature = 'kalt' | 'warm' | 'heiss'

export interface Lead {
  id: string
  name: string
  company: string | null
  lead_type: LeadType
  email: string | null
  phone: string | null
  address: string | null
  status: LeadStatus
  notes: string | null
  tags: string[] | null
  contact_person: string | null
  contact_role: string | null
  story: string | null
  trigger_points: string[] | null
  temperature: LeadTemperature
  next_action: string | null
  next_action_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  activities?: LeadActivity[]
}

export interface LeadActivity {
  id: string
  lead_id: string
  activity_type: string
  description: string
  event_id: string | null
  contacted_by: string | null
  contacted_at: string
  round_id: string | null
  // Joined
  contacted_member?: TeamMember | null
  event?: Event | null
}

export interface LeadRound {
  id: string
  lead_id: string
  round_number: number
  reason: string
  started_at: string
  ended_at: string | null
  started_by: string | null
  outcome: LeadStatus | null
  // Joined
  started_member?: TeamMember | null
  activities?: LeadActivity[]
}

export interface LeadEvent {
  lead_id: string
  event_id: string
  status: string
  notes: string | null
}

export interface SocialPost {
  id: string
  event_id: string | null
  concept_id: string | null
  platform: PlatformType
  post_type: string
  title: string | null
  caption: string | null
  hashtags: string[] | null
  scheduled_at: string | null
  published_at: string | null
  status: PostStatus
  series_id: string | null
  series_order: number | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  event?: Event | null
  concept?: Concept | null
  images?: SocialPostImage[]
}

export interface SocialPostImage {
  id: string
  post_id: string
  storage_path: string
  file_name: string
  sort_order: number
  created_at: string
}

export interface Review {
  id: string
  token: string
  food_rating: number | null
  ambience_rating: number | null
  service_rating: number | null
  comment: string | null
  guest_name: string | null
  guest_email: string | null
  goody_claimed: boolean
  goody_code: string | null
  created_at: string
}

export interface Story {
  id: string
  title: string
  subtitle: string | null
  category: StoryCategory
  paragraph_1: string
  paragraph_2: string | null
  paragraph_3: string | null
  illustration_url: string | null
  footer_signature: string
  linked_event_id: string | null
  linked_concept_id: string | null
  status: StoryStatus
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  linked_event?: Pick<Event, 'id' | 'title' | 'start_date'> | null
  linked_concept?: Pick<Concept, 'id' | 'name' | 'slug'> | null
}

export type TischkartenOccasion =
  | 'birthday'
  | 'anniversary'
  | 'business'
  | 'family'
  | 'wedding'
  | 'none'

export type TischkartenLanguage = 'de' | 'en' | 'fr' | 'it'

export interface Tischkarte {
  id: string
  // Eingaben
  guest_name: string
  occasion: TischkartenOccasion | null
  party_size: number | null
  reservation_date: string | null
  table_number: string | null
  custom_hint: string | null
  language: TischkartenLanguage
  // KI-generierter Inhalt
  title: string
  subtitle: string | null
  paragraph_1: string
  paragraph_2: string | null
  paragraph_3: string | null
  // Visuals
  illustration_url: string | null
  footer_signature: string
  created_at: string
  updated_at: string
}

export interface Holiday {
  id: string
  name: string
  date: string
  is_national: boolean
  canton: string
  year: number
}

// Supabase Database type (simplified — no RLS)
export interface Database {
  public: {
    Tables: {
      team_members: { Row: TeamMember; Insert: Partial<TeamMember> & { name: string }; Update: Partial<TeamMember> }
      concepts: { Row: Concept; Insert: Partial<Concept> & { name: string; slug: string }; Update: Partial<Concept> }
      events: { Row: Event; Insert: Partial<Event> & { title: string; start_date: string }; Update: Partial<Event> }
      tasks: { Row: Task; Insert: Partial<Task> & { title: string }; Update: Partial<Task> }
      event_images: { Row: EventImage; Insert: Partial<EventImage> & { event_id: string; storage_path: string; file_name: string }; Update: Partial<EventImage> }
      leads: { Row: Lead; Insert: Partial<Lead> & { name: string }; Update: Partial<Lead> }
      lead_activities: { Row: LeadActivity; Insert: Partial<LeadActivity> & { lead_id: string; activity_type: string; description: string }; Update: Partial<LeadActivity> }
      lead_rounds: { Row: LeadRound; Insert: Partial<LeadRound> & { lead_id: string; reason: string }; Update: Partial<LeadRound> }
      lead_events: { Row: LeadEvent; Insert: LeadEvent; Update: Partial<LeadEvent> }
      social_posts: { Row: SocialPost; Insert: Partial<SocialPost> & { platform: PlatformType }; Update: Partial<SocialPost> }
      social_post_images: { Row: SocialPostImage; Insert: Partial<SocialPostImage> & { post_id: string; storage_path: string; file_name: string }; Update: Partial<SocialPostImage> }
      reviews: { Row: Review; Insert: Partial<Review> & { token: string }; Update: Partial<Review> }
      holidays: { Row: Holiday; Insert: Partial<Holiday> & { name: string; date: string; year: number }; Update: Partial<Holiday> }
      stories: { Row: Story; Insert: Partial<Story> & { title: string; paragraph_1: string }; Update: Partial<Story> }
      tischkarten: { Row: Tischkarte; Insert: Partial<Tischkarte> & { guest_name: string; title: string; paragraph_1: string }; Update: Partial<Tischkarte> }
    }
  }
}
