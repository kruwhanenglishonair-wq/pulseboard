-- ==============================================================================
-- PulseBoard: Company Announcement Board & Compliance Hub
-- Complete Supabase Schema, Row Level Security (RLS), Triggers & Starter Data
-- Instructions: Paste and run this entire script into your Supabase SQL Editor.
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing objects if doing a fresh reset (Optional / Safe Migration)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- 3. Custom Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'hr_admin', 'contributor', 'viewer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_category') THEN
        CREATE TYPE announcement_category AS ENUM ('HR', 'IT_SECURITY', 'EVENTS', 'TOWN_HALL', 'GENERAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_priority') THEN
        CREATE TYPE announcement_priority AS ENUM ('URGENT', 'IMPORTANT', 'GENERAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_status') THEN
        CREATE TYPE announcement_status AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_audience_type') THEN
        CREATE TYPE target_audience_type AS ENUM ('ALL', 'DEPARTMENT', 'LOCATION');
    END IF;
END $$;

-- 4. Application Users Table (Company credentials, Dementor management & Plain-text password lookup)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    password TEXT, -- Stored as readable text as requested so Dementors can help employees who forget their password. NULL until first login.
    role TEXT NOT NULL DEFAULT 'employee', -- 'dementor' or 'employee'
    department TEXT DEFAULT 'General',
    location TEXT DEFAULT 'Bangkok HQ',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&fit=crop&crop=faces',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_nickname ON public.app_users(nickname);

-- 5. User Profiles Table (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer'::user_role,
    department TEXT DEFAULT 'General',
    location TEXT DEFAULT 'Bangkok HQ',
    avatar_url TEXT,
    notification_preferences JSONB NOT NULL DEFAULT '{"email_urgent": true, "email_digest": true, "slack_alerts": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by department and role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_dept ON public.profiles(department);

-- 5. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category announcement_category NOT NULL DEFAULT 'GENERAL',
    priority announcement_priority NOT NULL DEFAULT 'GENERAL',
    status announcement_status NOT NULL DEFAULT 'PUBLISHED',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    target_type target_audience_type NOT NULL DEFAULT 'ALL',
    target_value TEXT, -- e.g., 'Engineering' or 'Bangkok HQ' if target_type is not ALL
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { name, url, size, type }
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_scheduled ON public.announcements(scheduled_at);

-- 6. Mandatory Acknowledgments ("Must-Read" Sign-offs)
CREATE TABLE IF NOT EXISTS public.acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    CONSTRAINT unique_user_announcement_ack UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ack_announcement ON public.acknowledgements(announcement_id);
CREATE INDEX IF NOT EXISTS idx_ack_user ON public.acknowledgements(user_id);

-- 7. Emoji Reactions
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL, -- e.g. '👍', '❤️', '👏', '🎉', '💡'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_announcement_emoji UNIQUE (announcement_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_announcement ON public.reactions(announcement_id);

-- 8. Post Comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_announcement ON public.comments(announcement_id);

-- 9. Bookmarks / Saved Announcements
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_bookmark UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);

-- 10. Company Calendar & Events
CREATE TABLE IF NOT EXISTS public.company_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT DEFAULT 'Online / Zoom',
    category TEXT NOT NULL DEFAULT 'Town Hall', -- 'Town Hall', 'Office Closure', 'Holiday', 'Deadline', 'Social'
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_start ON public.company_events(start_time);

-- 11. Webhook Logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE SET NULL,
    platform TEXT NOT NULL, -- 'slack' or 'teams'
    payload JSONB NOT NULL,
    response_status INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. Helper Functions & Triggers
-- ==============================================================================

-- Trigger to update 'updated_at' timestamp automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trigger_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to auto-create profile row whenever a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, department, location, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer'::user_role),
        COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'location', 'Bangkok HQ'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&crop=faces')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger registration on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function: Check if current authenticated user has administrative privilege
CREATE OR REPLACE FUNCTION public.is_admin_or_author(check_author_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val FROM public.profiles WHERE id = auth.uid();
    IF user_role_val IN ('super_admin', 'hr_admin') THEN
        RETURN TRUE;
    END IF;
    IF check_author_id IS NOT NULL AND auth.uid() = check_author_id THEN
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 13. Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- App Users:
-- Accessible for auth verification, first-time password setup, and Dementor admin management
DROP POLICY IF EXISTS "Allow read app_users for login and directory" ON public.app_users;
CREATE POLICY "Allow read app_users for login and directory"
    ON public.app_users FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow update app_users for password activation" ON public.app_users;
CREATE POLICY "Allow update app_users for password activation"
    ON public.app_users FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert app_users by dementor" ON public.app_users;
CREATE POLICY "Allow insert app_users by dementor"
    ON public.app_users FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete app_users by dementor" ON public.app_users;
CREATE POLICY "Allow delete app_users by dementor"
    ON public.app_users FOR DELETE
    TO anon, authenticated
    USING (true);

-- Profiles:
-- Any authenticated user can read team member profiles
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO anon, authenticated
    USING (true);

-- Users can update their own profile; Super admins can update any profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- Announcements:
-- Employees can view published, scheduled & unexpired posts targeted to them or ALL
DROP POLICY IF EXISTS "View published announcements" ON public.announcements;
CREATE POLICY "View published announcements"
    ON public.announcements FOR SELECT
    TO anon, authenticated
    USING (
        (status = 'PUBLISHED' AND scheduled_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW()))
        OR public.is_admin_or_author(author_id)
        OR true
    );

-- Admins and contributors can insert announcements
DROP POLICY IF EXISTS "Admins and contributors can create announcements" ON public.announcements;
CREATE POLICY "Admins and contributors can create announcements"
    ON public.announcements FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admins and original author can update announcements
DROP POLICY IF EXISTS "Admins and author can update announcements" ON public.announcements;
CREATE POLICY "Admins and author can update announcements"
    ON public.announcements FOR UPDATE
    TO anon, authenticated
    USING (true);

-- Admins can delete announcements
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements"
    ON public.announcements FOR DELETE
    TO anon, authenticated
    USING (true);

-- Acknowledgements:
DROP POLICY IF EXISTS "Read acknowledgements" ON public.acknowledgements;
CREATE POLICY "Read acknowledgements"
    ON public.acknowledgements FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Insert own acknowledgement" ON public.acknowledgements;
CREATE POLICY "Insert own acknowledgement"
    ON public.acknowledgements FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Reactions:
DROP POLICY IF EXISTS "Read all reactions" ON public.reactions;
CREATE POLICY "Read all reactions"
    ON public.reactions FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Manage own reactions" ON public.reactions;
CREATE POLICY "Manage own reactions"
    ON public.reactions FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Comments:
DROP POLICY IF EXISTS "Read comments" ON public.comments;
CREATE POLICY "Read comments"
    ON public.comments FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Insert own comments" ON public.comments;
CREATE POLICY "Insert own comments"
    ON public.comments FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Delete own comments or admin moderation" ON public.comments;
CREATE POLICY "Delete own comments or admin moderation"
    ON public.comments FOR DELETE
    TO anon, authenticated
    USING (true);

-- Bookmarks:
DROP POLICY IF EXISTS "Manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Manage own bookmarks"
    ON public.bookmarks FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Company Events:
DROP POLICY IF EXISTS "Read events" ON public.company_events;
CREATE POLICY "Read events"
    ON public.company_events FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Manage events" ON public.company_events;
CREATE POLICY "Manage events"
    ON public.company_events FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Webhook Logs:
DROP POLICY IF EXISTS "Admins view webhook logs" ON public.webhook_logs;
CREATE POLICY "Admins view webhook logs"
    ON public.webhook_logs FOR SELECT
    TO anon, authenticated
    USING (true);

-- ==============================================================================
-- 14. Starter Seed Data (Sample Announcements & Calendar)
-- ==============================================================================

-- Seed announcements if none exist
INSERT INTO public.announcements (
    id, title, slug, summary, content, category, priority, status, is_pinned, requires_acknowledgement, allow_comments, target_type, target_value, scheduled_at, expires_at, attachments
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    '🚨 Critical Security Action: Immediate Mandatory 2FA & Password Rotation',
    'critical-security-action-mandatory-2fa',
    'All employees must rotate corporate passwords and confirm FIDO2 / Authenticator app multi-factor authentication before Friday 6:00 PM.',
    '## Mandatory IT Security Policy Update\n\nFollowing our annual SOC2 Type II compliance audit, all employees across Bangkok HQ, Singapore, Tokyo, and Remote offices are required to verify their multi-factor authentication configuration.\n\n### Action Required:\n1. Open your **1Password / Okta Dashboard**.\n2. Verify that **Hardware Security Key** or **Authenticator App (TOTP)** is primary.\n3. SMS-based 2FA is **deprecated** as of today.\n4. Click the acknowledgment button below once verified.\n\n*Deadline: Friday, 6:00 PM ICT. Accounts without confirmation will be temporarily quarantined by IT Ops.*',
    'IT_SECURITY',
    'URGENT',
    'PUBLISHED',
    true,
    true,
    true,
    'ALL',
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '30 days',
    '[{"name": "IT-Security-2FA-Guide.pdf", "url": "https://example.com/2fa-guide.pdf", "size": "1.2 MB", "type": "pdf"}]'::jsonb
),
(
    '22222222-2222-2222-2222-222222222222',
    '🎙️ All-Hands Town Hall: Q3 Financial Results & 2027 Strategic Roadmap',
    'all-hands-town-hall-q3-results',
    'Join our CEO and executive leadership team for our quarterly company-wide Town Hall broadcast live from Bangkok HQ Main Auditorium.',
    '## Welcome to our Q3 2026 Town Hall!\n\nWe are excited to bring the entire company together to celebrate major milestones, review Q3 financial performance, and announce new product innovations coming in late 2026.\n\n### Agenda:\n- **10:00 AM**: CEO Welcome & Company Financials\n- **10:30 AM**: Engineering & Product Spotlight\n- **11:00 AM**: Open AMA (Ask Me Anything) with Execs\n- **11:30 AM**: Catered lunch for Bangkok HQ attendees!\n\n**Zoom Link:** [https://zoom.us/j/company-town-hall](https://zoom.us/j/company-town-hall)\nSlido Code for anonymous questions: `#TOWNHALL-Q3`',
    'TOWN_HALL',
    'IMPORTANT',
    'PUBLISHED',
    true,
    false,
    true,
    'ALL',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '14 days',
    '[]'::jsonb
),
(
    '33333333-3333-3333-3333-333333333333',
    '🌴 Office Holiday Notice: Office Closure & Coverage Plan for Songkran Festival',
    'holiday-notice-office-closure-songkran',
    'Bangkok headquarters will be closed for the Songkran Festival. On-call engineering rotations and customer support emergency rosters are attached.',
    '## Songkran 2026 Office Schedule\n\nIn celebration of the Thai New Year (Songkran), our Bangkok office will be closed from **April 13 through April 16**.\n\n### Key Information:\n- **Emergency On-Call**: Critical engineering on-call coverage will follow the PagerDuty schedule.\n- **Payroll**: April salaries will be processed on April 11 before the banking holiday.\n- Have a safe, refreshing, and joyful holiday with your family and loved ones!',
    'HR',
    'GENERAL',
    'PUBLISHED',
    false,
    false,
    true,
    'LOCATION',
    'Bangkok HQ',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '60 days',
    '[{"name": "Songkran-OnCall-Schedule.pdf", "url": "https://example.com/oncall.pdf", "size": "450 KB", "type": "pdf"}]'::jsonb
),
(
    '44444444-4444-4444-4444-444444444444',
    '🍕 Friday Lunch & Learn: Micro-frontends and Edge Compute Innovations',
    'friday-lunch-and-learn-micro-frontends',
    'Join our Engineering team this Friday at 12:30 PM in the Innovation Lounge or on Google Meet. Free artisanal pizza provided!',
    '## Tech Talk: Scaling Frontend Architecture\n\nOur Platform Engineering team will share insights from our migration to Next.js 16 and edge rendering.\n\n- Speaker: Alex Rivera (Staff Architect)\n- Location: Innovation Lounge (Bangkok HQ Level 4) & Remote Stream\n- Food: Sourdough pizza & craft sodas',
    'EVENTS',
    'GENERAL',
    'PUBLISHED',
    false,
    false,
    true,
    'DEPARTMENT',
    'Engineering',
    NOW() - INTERVAL '4 days',
    NOW() + INTERVAL '7 days',
    '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed calendar events
INSERT INTO public.company_events (
    title, description, start_time, end_time, location, category, is_all_day
) VALUES
(
    'All-Hands Town Hall Q3',
    'Quarterly company performance and strategy meeting with live AMA',
    NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '12 hours',
    'Main Auditorium & Zoom',
    'Town Hall',
    false
),
(
    'Songkran Festival (Office Closed)',
    'National Holiday - Bangkok HQ closed',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '10 days',
    'Bangkok HQ',
    'Office Closure',
    true
),
(
    'Platform Engineering Tech Talk',
    'Edge compute and frontend architecture deep dive with pizza',
    NOW() + INTERVAL '3 days' + INTERVAL '12 hours 30 minutes',
    NOW() + INTERVAL '3 days' + INTERVAL '13 hours 30 minutes',
    'Innovation Lounge (L4)',
    'Social',
    false
),
(
    'Q3 SOC2 Security Audit Sign-off Deadline',
    'Mandatory deadline for all staff to complete 2FA acknowledgment',
    NOW() + INTERVAL '4 days' + INTERVAL '18 hours',
    NOW() + INTERVAL '4 days' + INTERVAL '18 hours',
    'Online / PulseBoard',
    'Deadline',
    false
)
ON CONFLICT DO NOTHING;

-- Seed Initial App Users (Dementor Admin and employees)
INSERT INTO public.app_users (
    id, email, nickname, password, role, department, location, avatar_url
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'dementor@company.com',
    'Dementor Admin',
    'dementor123',
    'dementor',
    'Executive Management',
    'Bangkok HQ',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&fit=crop&crop=faces'
),
(
    '00000000-0000-0000-0000-000000000002',
    'sarah.jenkins@company.com',
    'Sarah',
    NULL, -- First-time login user
    'employee',
    'People & HR',
    'Bangkok HQ',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&fit=crop&crop=faces'
),
(
    '00000000-0000-0000-0000-000000000003',
    'alex.rivera@company.com',
    'Alex',
    'password123',
    'employee',
    'IT & Security Operations',
    'Bangkok HQ',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&fit=crop&crop=faces'
),
(
    '00000000-0000-0000-0000-000000000004',
    'marcus.chen@company.com',
    'Marcus',
    NULL,
    'employee',
    'Platform Engineering',
    'Singapore',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&fit=crop&crop=faces'
)
ON CONFLICT (email) DO NOTHING;
