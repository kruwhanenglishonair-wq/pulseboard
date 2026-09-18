export type UserRole = 'super_admin' | 'hr_admin' | 'contributor' | 'viewer';

export type AnnouncementCategory = 'HR' | 'IT_SECURITY' | 'EVENTS' | 'TOWN_HALL' | 'GENERAL';

export type AnnouncementPriority = 'URGENT' | 'IMPORTANT' | 'GENERAL';

export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export type TargetAudienceType = 'ALL' | 'DEPARTMENT' | 'LOCATION';

export interface AppUser {
  id: string;
  email: string;
  nickname: string;
  full_name?: string; // Alias for nickname
  password: string | null; // Stored in plain text as requested for Dementor recovery
  role: 'dementor' | 'employee' | string;
  department: string;
  location: string;
  avatar_url: string;
  notification_preferences?: {
    email_urgent: boolean;
    email_digest: boolean;
    slack_alerts: boolean;
  };
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  location: string;
  avatar_url: string;
  notification_preferences: {
    email_urgent: boolean;
    email_digest: boolean;
    slack_alerts: boolean;
  };
  created_at: string;
}

export interface Attachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  is_pinned: boolean;
  requires_acknowledgement: boolean;
  allow_comments: boolean;
  target_type: TargetAudienceType;
  target_value?: string | null;
  scheduled_at: string;
  expires_at?: string | null;
  attachments: Attachment[];
  author_id?: string | null;
  author?: Profile;
  created_at: string;
  updated_at: string;
  
  // Computed / Aggregated attributes
  acknowledgements_count?: number;
  user_acknowledged?: boolean;
  acknowledged_at?: string | null;
  reactions_summary?: Record<string, number>;
  user_reactions?: string[];
  comments_count?: number;
  user_bookmarked?: boolean;
}

export interface Acknowledgement {
  id: string;
  announcement_id: string;
  user_id: string;
  acknowledged_at: string;
  user?: Profile;
}

export interface Reaction {
  id: string;
  announcement_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Comment {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export interface Bookmark {
  id: string;
  announcement_id: string;
  user_id: string;
  created_at: string;
}

export interface CompanyEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location: string;
  category: 'Town Hall' | 'Office Closure' | 'Holiday' | 'Deadline' | 'Social' | string;
  announcement_id?: string;
  is_all_day: boolean;
  created_at?: string;
}

export interface AuditRecord {
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  location: string;
  avatar_url: string;
  role: UserRole;
  status: 'acknowledged' | 'pending';
  acknowledged_at?: string | null;
}
