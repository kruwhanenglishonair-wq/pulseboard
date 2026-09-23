import { Profile, Announcement, CompanyEvent, Comment, AppUser, Department } from './types';

export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'dept-eng',
    name: 'Platform Engineering',
    description: 'Core infrastructure, software development, site reliability, and developer tooling.',
    color: '#3b82f6',
    icon: 'Code',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dept-design',
    name: 'Product Design',
    description: 'UI/UX research, design systems, visual branding, and product user experience.',
    color: '#ec4899',
    icon: 'Palette',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dept-hr',
    name: 'People & HR',
    description: 'Employee lifecycle, onboarding, corporate wellness, culture, and talent acquisition.',
    color: '#10b981',
    icon: 'HeartHandshake',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dept-sales',
    name: 'Sales & Growth',
    description: 'Client partnerships, inbound sales pipelines, market growth, and revenue operations.',
    color: '#f59e0b',
    icon: 'TrendingUp',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dept-ops',
    name: 'Operations & Facilities',
    description: 'Global logistics, office infrastructure, procurement, and workspace safety.',
    color: '#8b5cf6',
    icon: 'Building2',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'dept-exec',
    name: 'Executive Management',
    description: 'Strategic leadership, company direction, investor relations, and corporate governance.',
    color: '#6366f1',
    icon: 'ShieldCheck',
    created_at: '2026-01-01T08:00:00Z'
  }
];

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
