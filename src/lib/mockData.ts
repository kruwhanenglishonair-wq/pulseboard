import { Profile, Announcement, CompanyEvent, Comment, AppUser } from './types';

// Initial Master Dementor Admin account (Default system administrator)
export const INITIAL_DEMENTOR: AppUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dementor@company.com',
  nickname: 'Dementor Admin',
  password: 'dementor123',
  role: 'dementor',
  department: 'Executive Management',
  location: 'Bangkok HQ',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&fit=crop&crop=faces',
  created_at: '2026-01-01T08:00:00Z'
};

// Initial state with only the administrator - no mock employees
export const MOCK_APP_USERS: AppUser[] = [INITIAL_DEMENTOR];

export const MOCK_PROFILES: Profile[] = [];

// Empty initial announcements - ready for real content
export const MOCK_ANNOUNCEMENTS: Announcement[] = [];

// Empty initial company calendar events
export const MOCK_EVENTS: CompanyEvent[] = [];

// Empty initial comments
export const MOCK_COMMENTS: Comment[] = [];
