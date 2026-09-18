import { Profile, Announcement, CompanyEvent, Comment, AppUser } from './types';

export const MOCK_APP_USERS: AppUser[] = [
  {
    id: 'user-dementor',
    email: 'dementor@company.com',
    nickname: 'Dementor Admin',
    password: 'dementor123',
    role: 'dementor',
    department: 'Executive Management',
    location: 'Bangkok HQ',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&fit=crop&crop=faces',
    created_at: '2026-01-01T08:00:00Z'
  },
  {
    id: 'user-001',
    email: 'sarah.jenkins@company.com',
    nickname: 'Sarah',
    password: null, // First-time user: will be forced to set password on first login
    role: 'employee',
    department: 'People & HR',
    location: 'Bangkok HQ',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&fit=crop&crop=faces',
    created_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-002',
    email: 'alex.rivera@company.com',
    nickname: 'Alex',
    password: 'password123',
    role: 'employee',
    department: 'IT & Security Operations',
    location: 'Bangkok HQ',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&fit=crop&crop=faces',
    created_at: '2026-01-15T09:00:00Z'
  },
  {
    id: 'user-003',
    email: 'marcus.chen@company.com',
    nickname: 'Marcus',
    password: null, // First-time user
    role: 'employee',
    department: 'Platform Engineering',
    location: 'Singapore',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&fit=crop&crop=faces',
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'user-004',
    email: 'elena.rostova@company.com',
    nickname: 'Elena',
    password: 'elena2026',
    role: 'employee',
    department: 'Product Design',
    location: 'Tokyo',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&fit=crop&crop=faces',
    created_at: '2026-02-10T11:00:00Z'
  },
  {
    id: 'user-005',
    email: 'david.kim@company.com',
    nickname: 'David',
    password: null, // First-time user
    role: 'employee',
    department: 'Sales & Growth',
    location: 'Remote',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&fit=crop&crop=faces',
    created_at: '2026-03-01T08:30:00Z'
  }
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'user-001',
    email: 'sarah.jenkins@company.com',
    full_name: 'Sarah Jenkins',
    role: 'super_admin',
    department: 'People & HR',
    location: 'Bangkok HQ',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&fit=crop&crop=faces',
    notification_preferences: { email_urgent: true, email_digest: true, slack_alerts: true },
    created_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'user-002',
    email: 'alex.rivera@company.com',
    full_name: 'Alex Rivera',
    role: 'hr_admin',
    department: 'IT & Security Operations',
    location: 'Bangkok HQ',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&fit=crop&crop=faces',
    notification_preferences: { email_urgent: true, email_digest: false, slack_alerts: true },
    created_at: '2026-01-15T09:00:00Z'
  },
  {
    id: 'user-003',
    email: 'marcus.chen@company.com',
    full_name: 'Marcus Chen',
    role: 'contributor',
    department: 'Platform Engineering',
    location: 'Singapore',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&fit=crop&crop=faces',
    notification_preferences: { email_urgent: true, email_digest: true, slack_alerts: true },
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'user-004',
    email: 'elena.rostova@company.com',
    full_name: 'Elena Rostova',
    role: 'viewer',
    department: 'Product Design',
    location: 'Tokyo',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&fit=crop&crop=faces',
    notification_preferences: { email_urgent: true, email_digest: true, slack_alerts: false },
    created_at: '2026-02-10T11:00:00Z'
  },
  {
    id: 'user-005',
    email: 'david.kim@company.com',
    full_name: 'David Kim',
    role: 'viewer',
    department: 'Sales & Growth',
    location: 'Remote',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&fit=crop&crop=faces',
    notification_preferences: { email_urgent: true, email_digest: true, slack_alerts: true },
    created_at: '2026-03-01T08:30:00Z'
  }
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-001',
    title: '🚨 Critical Security Mandate: Immediate 2FA Verification & Key Rotation',
    slug: 'critical-security-mandate-immediate-2fa-verification',
    summary: 'All employees must verify FIDO2 / Authenticator App multi-factor settings by Friday 6:00 PM ICT. SMS 2FA is formally deprecated.',
    content: `## Mandatory IT Security Policy Update (SOC2 Type II Compliance)

Following our annual SOC2 Type II audit, all team members across **Bangkok HQ**, **Singapore**, **Tokyo**, and **Remote** locations must review and re-verify their authentication credentials.

### Immediate Actions Required:
1. **Access 1Password / Okta Portal**: Log in and ensure an Authenticator App (Google Authenticator, 1Password, or YubiKey) is designated as your **primary** authentication method.
2. **Remove SMS Authentication**: SMS-based 2FA is susceptible to SIM-swapping and has been phased out enterprise-wide.
3. **Confirm Acknowledgment**: Once verified, click the **"I have read and understood"** compliance button below.

> **Deadline**: Friday, 6:00 PM ICT. Accounts without confirmation will undergo automated access suspension by IT Ops until unlocked.

For assistance, reach out directly in \`#it-support\` or contact the Helpdesk at ext. 4402.`,
    category: 'IT_SECURITY',
    priority: 'URGENT',
    status: 'PUBLISHED',
    is_pinned: true,
    requires_acknowledgement: true,
    allow_comments: true,
    target_type: 'ALL',
    target_value: null,
    scheduled_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), // 3 hours ago
    expires_at: new Date(Date.now() + 3600 * 1000 * 24 * 30).toISOString(),
    attachments: [
      {
        name: 'Enterprise-2FA-Setup-Guide-2026.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '1.4 MB',
        type: 'pdf'
      }
    ],
    author_id: 'user-002',
    author: MOCK_PROFILES[1],
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    acknowledgements_count: 3,
    user_acknowledged: false,
    acknowledged_at: null,
    reactions_summary: { '👍': 14, '👏': 8, '💡': 5 },
    user_reactions: ['👍'],
    comments_count: 4,
    user_bookmarked: true
  },
  {
    id: 'ann-002',
    title: '🎙️ All-Hands Town Hall: Q3 Financial Results & 2027 Strategic Vision',
    slug: 'all-hands-town-hall-q3-results-2027-vision',
    summary: 'Join our CEO and executive leadership this Thursday for our quarterly company-wide Town Hall broadcast live from Bangkok HQ Auditorium.',
    content: `## Welcome to the Q3 2026 Global Town Hall!

We are excited to bring the entire company together to celebrate milestone achievements, review Q3 financial performance, and unveil our 2027 strategic product roadmap.

### Agenda:
- **10:00 AM ICT**: CEO Welcome & Company Financial Review
- **10:30 AM ICT**: Engineering & AI Product Demonstrations
- **11:00 AM ICT**: Open Executive Q&A (AMA)
- **11:30 AM ICT**: Catered buffet lunch for Bangkok HQ attendees!

### Participation Links:
- **Livestream Zoom Link**: [https://zoom.us/j/987654321](https://zoom.us/j/987654321) (Passcode: \`PULSE2026\`)
- **Anonymous Slido Q&A**: Submit your questions in advance at [slido.com](https://slido.com) with event code **\`#TOWNHALL-Q3\`**.

Add this event to your calendar using the **Add to Calendar** button below!`,
    category: 'TOWN_HALL',
    priority: 'IMPORTANT',
    status: 'PUBLISHED',
    is_pinned: true,
    requires_acknowledgement: false,
    allow_comments: true,
    target_type: 'ALL',
    target_value: null,
    scheduled_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), // 1 day ago
    expires_at: new Date(Date.now() + 3600 * 1000 * 24 * 14).toISOString(),
    attachments: [
      {
        name: 'TownHall-Q3-Deck-Summary.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '4.8 MB',
        type: 'pdf'
      }
    ],
    author_id: 'user-001',
    author: MOCK_PROFILES[0],
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    acknowledgements_count: 0,
    user_acknowledged: false,
    reactions_summary: { '🎉': 32, '❤️': 18, '👏': 24 },
    user_reactions: ['🎉', '❤️'],
    comments_count: 7,
    user_bookmarked: false
  },
  {
    id: 'ann-003',
    title: '🌴 Office Closure Notice: Songkran Thai New Year Holidays & Support Roster',
    slug: 'office-closure-songkran-holidays-support-roster',
    summary: 'Bangkok HQ will be closed from April 13 through April 16 for Songkran. Engineering emergency on-call schedule is attached.',
    content: `## Songkran Festival 2026 Office Schedule

In celebration of the Thai New Year (Songkran Festival), our Bangkok office will be officially closed from **Monday, April 13 through Thursday, April 16**. Regular office operations resume on Friday, April 17.

### Operational Guidelines:
- **Emergency On-Call Coverage**: Tier-1 infrastructure and customer escalation rosters remain fully staffed on PagerDuty.
- **Office Facility Access**: Keycard access will be active for emergency needs, but HVAC will operate on weekend economy mode.
- **April Payroll Processing**: April salary disbursal will occur ahead of schedule on **April 10** prior to the commercial banking closure.

We wish everyone a refreshing, festive, and prosperous Songkran! 💦🐘`,
    category: 'HR',
    priority: 'GENERAL',
    status: 'PUBLISHED',
    is_pinned: false,
    requires_acknowledgement: false,
    allow_comments: true,
    target_type: 'LOCATION',
    target_value: 'Bangkok HQ',
    scheduled_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(), // 2 days ago
    expires_at: new Date(Date.now() + 3600 * 1000 * 24 * 45).toISOString(),
    attachments: [
      {
        name: 'Songkran-2026-OnCall-Schedule.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '890 KB',
        type: 'pdf'
      }
    ],
    author_id: 'user-001',
    author: MOCK_PROFILES[0],
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    acknowledgements_count: 0,
    user_acknowledged: false,
    reactions_summary: { '❤️': 21, '🎉': 19 },
    user_reactions: [],
    comments_count: 2,
    user_bookmarked: false
  },
  {
    id: 'ann-004',
    title: '🍕 Platform Tech Talk: Next.js 16 Edge Rendering & AI Agent Integrations',
    slug: 'platform-tech-talk-nextjs-16-edge-ai-agents',
    summary: 'Join Platform Engineering this Friday at 12:30 PM in the 4th Floor Innovation Lounge or online for demos & sourdough pizza!',
    content: `## Engineering Tech Spotlight: Next-Gen Architecture

Our Core Architecture group will present the architectural patterns developed during our recent migration to Next.js 16, edge caching, and autonomous AI agents.

### Key Takeaways:
- Real-time state synchronizations using Postgres changes.
- Edge rendering performance gains for global offices.
- Live demonstration of internal AI tooling.

Free lunch and craft drinks provided at Bangkok HQ! Please RSVP so we order enough pizza.`,
    category: 'EVENTS',
    priority: 'GENERAL',
    status: 'PUBLISHED',
    is_pinned: false,
    requires_acknowledgement: false,
    allow_comments: true,
    target_type: 'DEPARTMENT',
    target_value: 'Engineering',
    scheduled_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    expires_at: new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString(),
    attachments: [],
    author_id: 'user-003',
    author: MOCK_PROFILES[2],
    created_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    acknowledgements_count: 0,
    user_acknowledged: false,
    reactions_summary: { '👍': 17, '💡': 11, '🎉': 8 },
    user_reactions: ['💡'],
    comments_count: 5,
    user_bookmarked: true
  }
];

export const MOCK_EVENTS: CompanyEvent[] = [
  {
    id: 'evt-001',
    title: 'All-Hands Global Town Hall Q3',
    description: 'Quarterly financial overview and executive roadmap presentation.',
    start_time: new Date(Date.now() + 3600 * 1000 * 26).toISOString(),
    end_time: new Date(Date.now() + 3600 * 1000 * 28).toISOString(),
    location: 'Bangkok Auditorium & Zoom',
    category: 'Town Hall',
    announcement_id: 'ann-002',
    is_all_day: false
  },
  {
    id: 'evt-002',
    title: 'Songkran Thai New Year (Office Closed)',
    description: 'Bangkok HQ closed for public holiday.',
    start_time: new Date(Date.now() + 3600 * 1000 * 24 * 5).toISOString(),
    end_time: new Date(Date.now() + 3600 * 1000 * 24 * 8).toISOString(),
    location: 'Bangkok HQ',
    category: 'Office Closure',
    announcement_id: 'ann-003',
    is_all_day: true
  },
  {
    id: 'evt-003',
    title: 'Mandatory 2FA Policy Sign-off Cutoff',
    description: 'All employees must acknowledge security compliance.',
    start_time: new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(),
    end_time: new Date(Date.now() + 3600 * 1000 * 24 * 2 + 1800 * 1000).toISOString(),
    location: 'PulseBoard Internal',
    category: 'Deadline',
    announcement_id: 'ann-001',
    is_all_day: false
  },
  {
    id: 'evt-004',
    title: 'Friday Tech Talk: Edge & AI Agents',
    description: 'Platform team presentation with free pizza & drinks.',
    start_time: new Date(Date.now() + 3600 * 1000 * 48).toISOString(),
    end_time: new Date(Date.now() + 3600 * 1000 * 50).toISOString(),
    location: 'Innovation Lounge (L4)',
    category: 'Social',
    announcement_id: 'ann-004',
    is_all_day: false
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'cmt-001',
    announcement_id: 'ann-001',
    user_id: 'user-003',
    content: 'Just rotated my keys using YubiKey 5C NFC. Smooth setup!',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    user: MOCK_PROFILES[2]
  },
  {
    id: 'cmt-002',
    announcement_id: 'ann-001',
    user_id: 'user-004',
    content: 'Are 1Password passkeys also approved for Okta login?',
    created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    user: MOCK_PROFILES[3]
  },
  {
    id: 'cmt-003',
    announcement_id: 'ann-001',
    user_id: 'user-002',
    content: '@Elena Yes! Passkeys stored in 1Password fulfill all SOC2 FIDO2 requirements.',
    created_at: new Date(Date.now() - 1800 * 1000).toISOString(),
    user: MOCK_PROFILES[1]
  }
];
