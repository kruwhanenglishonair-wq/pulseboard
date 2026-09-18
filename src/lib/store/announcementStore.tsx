'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Announcement,
  Profile,
  CompanyEvent,
  Comment,
  AuditRecord,
  AppUser
} from '../types';
import { MOCK_ANNOUNCEMENTS, MOCK_EVENTS, MOCK_COMMENTS, MOCK_APP_USERS } from '../mockData';
import { getSupabaseClient, isSupabaseConfigured, getSupabaseUrl, setSupabaseConfig } from '../supabase';

interface AnnouncementStoreContextType {
  currentUser: AppUser | null;
  isDementor: boolean;
  appUsers: AppUser[];
  announcements: Announcement[];
  events: CompanyEvent[];
  comments: Record<string, Comment[]>;
  isOffline: boolean;
  isSupabaseLive: boolean;
  supabaseEndpoint: string;
  refreshData: () => Promise<void>;
  connectCustomSupabase: (url: string, key: string) => boolean;
  
  // Auth Actions
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<{
    success: boolean;
    requiresPasswordSetup?: boolean;
    user?: AppUser;
    message?: string;
  }>;
  setPassword: (email: string, newPassword: string, rememberMe?: boolean) => Promise<{
    success: boolean;
    user: AppUser;
  }>;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Dementor User Management
  addUser: (userData: { email: string; nickname: string; department?: string; location?: string }) => Promise<AppUser>;
  updateUser: (id: string, userData: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Post Actions
  acknowledgeAnnouncement: (announcementId: string) => void;
  toggleReaction: (announcementId: string, emoji: string) => void;
  addComment: (announcementId: string, content: string) => void;
  toggleBookmark: (announcementId: string) => void;
  togglePin: (announcementId: string) => void;
  createAnnouncement: (data: Partial<Announcement>) => Announcement;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  getAuditLogs: (announcementId: string) => { records: AuditRecord[]; rate: number; total: number; acknowledged: number };
  addEvent: (eventData: Partial<CompanyEvent>) => CompanyEvent;
}

const AnnouncementStoreContext = createContext<AnnouncementStoreContextType | null>(null);

const STORAGE_KEYS = {
  USERS: 'pulseboard_users_v3',
  AUTH_USER: 'pulseboard_auth_user_v3', // localStorage (Remember Me)
  SESSION_USER: 'pulseboard_session_user_v3', // sessionStorage
  ANNOUNCEMENTS: 'pulseboard_announcements_v3',
  COMMENTS: 'pulseboard_comments_v3',
  EVENTS: 'pulseboard_events_v3',
  ACKS: 'pulseboard_acks_v3'
};

export const AnnouncementStoreProvider = ({ children }: { children: ReactNode }) => {
  const [appUsers, setAppUsers] = useState<AppUser[]>(MOCK_APP_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [events, setEvents] = useState<CompanyEvent[]>(MOCK_EVENTS);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [acknowledgements, setAcknowledgements] = useState<Record<string, Array<{ userId: string; timestamp: string }>>>({});
  const [isOffline, setIsOffline] = useState(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Check if current user is a "Dementor"
  const isDementor = Boolean(
    currentUser &&
    (currentUser.nickname.toLowerCase().startsWith('dementor') ||
     currentUser.nickname.toLowerCase().includes('dementor') ||
     currentUser.role === 'dementor')
  );

  // Restore session and local storage on client load, plus sync with Supabase if configured
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!window.navigator.onLine);

    try {
      // 1. Load users list from localStorage first
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      let activeUsers = MOCK_APP_USERS;
      if (storedUsers) {
        try {
          activeUsers = JSON.parse(storedUsers);
          setAppUsers(activeUsers);
        } catch (e) {
          activeUsers = MOCK_APP_USERS;
        }
      }

      // 2. Check Remember Me in localStorage or Session in sessionStorage
      const persistentUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const sessionUser = sessionStorage.getItem(STORAGE_KEYS.SESSION_USER);
      const userToRestore = persistentUser || sessionUser;

      if (userToRestore) {
        const parsed = JSON.parse(userToRestore);
        // Find latest fresh version from activeUsers
        const freshUser = activeUsers.find((u) => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
        setCurrentUser(freshUser || parsed);
      } else {
        // Remain logged out by default
        setCurrentUser(null);
      }

      // 3. Load announcements, comments, events from storage
      const storedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (storedAnnouncements) setAnnouncements(JSON.parse(storedAnnouncements));

      const storedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (storedComments) setComments(JSON.parse(storedComments));

      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (storedEvents) setEvents(JSON.parse(storedEvents));

      const storedAcks = localStorage.getItem(STORAGE_KEYS.ACKS);
      if (storedAcks) setAcknowledgements(JSON.parse(storedAcks));

      // Check for locally saved custom credentials (useful when testing on localhost)
      const customUrl = localStorage.getItem('pulseboard_supabase_url');
      const customKey = localStorage.getItem('pulseboard_supabase_key');
      if (customUrl && customKey) {
        setSupabaseConfig(customUrl, customKey);
        setIsSupabaseLive(true);
      }

      // 4. Fetch server configuration (reads Vercel SUPABASE_URL / SUPABASE_ANON_KEY)
      fetch('/api/config/supabase')
        .then((res) => res.json())
        .then((cfg) => {
          if (cfg && cfg.configured && cfg.url && cfg.anonKey) {
            setSupabaseConfig(cfg.url, cfg.anonKey);
            setIsSupabaseLive(true);
          }
          // Now fetch live data from server routes
          refreshData();
        })
        .catch(() => {
          refreshData();
        });
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = async () => {
    try {
      // 1. Fetch live users from server API route
      const usersRes = await fetch('/api/app-users').then((r) => r.json()).catch(() => null);
      if (usersRes && usersRes.success && Array.isArray(usersRes.users)) {
        setIsSupabaseLive(true);
        setAppUsers(usersRes.users);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersRes.users));
        }
      } else if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
          if (data) {
            setAppUsers(data);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
            }
          }
        }
      }

      // 2. Fetch live announcements from server API route
      const annRes = await fetch('/api/announcements').then((r) => r.json()).catch(() => null);
      if (annRes && annRes.success && Array.isArray(annRes.announcements)) {
        setAnnouncements(annRes.announcements);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(annRes.announcements));
        }
      } else if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data } = await supabase.from('announcements').select('*').order('scheduled_at', { ascending: false });
          if (data) {
            setAnnouncements(data as any);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(data));
            }
          }
        }
      }

      // 3. Fetch live company events from server API route
      const eventsRes = await fetch('/api/events').then((r) => r.json()).catch(() => null);
      if (eventsRes && eventsRes.success && Array.isArray(eventsRes.events)) {
        setEvents(eventsRes.events);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventsRes.events));
        }
      } else if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data } = await supabase.from('company_events').select('*').order('start_time', { ascending: true });
          if (data) {
            setEvents(data as any);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data));
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error refreshing live data:', err);
    }
  };

  const saveUsers = (updated: AppUser[]) => {
    setAppUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    }
  };

  const saveAnnouncements = (items: Announcement[]) => {
    setAnnouncements(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(items));
    }
  };

  // Connect custom Supabase credentials from UI (for localhost)
  const connectCustomSupabase = (url: string, key: string): boolean => {
    if (url && key && url.trim() && key.trim()) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pulseboard_supabase_url', url.trim());
        localStorage.setItem('pulseboard_supabase_key', key.trim());
      }
      setSupabaseConfig(url.trim(), key.trim());
      setIsSupabaseLive(true);
      refreshData();
      return true;
    }
    return false;
  };

  // Auth: Login function (Live query to Supabase via server API and client fallback)
  const login = async (email: string, password?: string, rememberMe: boolean = true) => {
    const cleanEmail = email.trim();

    let user: AppUser | undefined = undefined;
    let serverErrorMessage: string | null = null;
    let serverUnconfigured = false;

    // 1. Query live server endpoint (which reads SUPABASE_URL and SUPABASE_ANON_KEY on Vercel server)
    try {
      const res = await fetch(`/api/app-users?email=${encodeURIComponent(cleanEmail)}`);
      const json = await res.json();
      if (res.ok) {
        if (json.success && json.user) {
          user = json.user;
          setAppUsers((prev) => {
            const exists = prev.some((u) => u.id === json.user.id);
            if (exists) return prev.map((u) => (u.id === json.user.id ? json.user : u));
            return [json.user, ...prev];
          });
        }
      } else {
        if (res.status === 503 || json.error?.includes('not configured')) {
          serverUnconfigured = true;
        } else if (json.error) {
          serverErrorMessage = json.error;
        }
      }
    } catch (e) {
      console.warn('Server query error on login:', e);
    }

    // 2. Fallback to client Supabase instance if available
    if (!user && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (error && !serverErrorMessage) {
            serverErrorMessage = error.message;
          }

          if (data) {
            user = data;
            setAppUsers((prev) => {
              const exists = prev.some((u) => u.id === data.id);
              if (exists) return prev.map((u) => (u.id === data.id ? data : u));
              return [data, ...prev];
            });
          }
        } catch (e) {
          console.warn('Supabase query error on login:', e);
        }
      }
    }

    if (!user) {
      user = appUsers.find((u) => u.email.toLowerCase() === cleanEmail.toLowerCase());
    }

    if (!user) {
      if (serverUnconfigured && !isSupabaseConfigured()) {
        return {
          success: false,
          message: 'Supabase is not connected to this local server (localhost:3000). Since you added the variables to Vercel, please test directly on your Vercel URL, or enter your Supabase URL & Anon Key on this page to test locally.'
        };
      }
      if (serverErrorMessage) {
        return {
          success: false,
          message: `Database error: ${serverErrorMessage}`
        };
      }
      return {
        success: false,
        message: 'Email not registered in database. Please check your spelling or contact the Dementor.'
      };
    }

    // Check if user has never set a password yet (password is NULL or empty)
    if (user.password === null || user.password === '') {
      return {
        success: false,
        requiresPasswordSetup: true,
        user,
        message: `Welcome, ${user.nickname}! Please set a password for your company account.`
      };
    }

    // Verify password (plain text comparison as requested for Dementor visibility)
    if (user.password !== password) {
      return {
        success: false,
        message: 'Incorrect password. Contact Dementor if you forgot your password.'
      };
    }

    // Successful login
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        sessionStorage.removeItem(STORAGE_KEYS.SESSION_USER);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(user));
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    }

    return { success: true, user };
  };

  // Auth: First-time set password
  const setPassword = async (email: string, newPassword: string, rememberMe: boolean = true) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      await fetch('/api/app-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: newPassword })
      });
    } catch (e) {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('app_users').update({ password: newPassword }).eq('email', cleanEmail);
        }
      }
    }

    const updatedUsers = appUsers.map((u) => {
      if (u.email.toLowerCase() === cleanEmail) {
        return {
          ...u,
          password: newPassword,
          updated_at: new Date().toISOString()
        };
      }
      return u;
    });

    saveUsers(updatedUsers);
    const updatedUser = updatedUsers.find((u) => u.email.toLowerCase() === cleanEmail)!;
    setCurrentUser(updatedUser);

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_USER, JSON.stringify(updatedUser));
      }
    }

    return { success: true, user: updatedUser };
  };

  // Auth: Logout
  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    }
  };

  const switchUser = (userId: string) => {
    const target = appUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(target));
      }
    }
  };

  // Dementor: Add new user (password is null by default!)
  const addUser = async (userData: { email: string; nickname: string; department?: string; location?: string }): Promise<AppUser> => {
    const isDem = userData.nickname.toLowerCase().startsWith('dementor');
    const newUser: AppUser = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
      email: userData.email.trim(),
      nickname: userData.nickname.trim(),
      password: null, // Initialized as NULL per requirements
      role: isDem ? 'dementor' : 'employee',
      department: userData.department || 'General',
      location: userData.location || 'Bangkok HQ',
      avatar_url: `https://images.unsplash.com/photo-${1534528741775 + (appUsers.length % 5)}?w=160&fit=crop&crop=faces`,
      created_at: new Date().toISOString()
    };

    try {
      await fetch('/api/app-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
    } catch (e) {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('app_users').insert([newUser]);
        }
      }
    }

    const updated = [newUser, ...appUsers.filter((u) => u.email !== newUser.email)];
    saveUsers(updated);
    return newUser;
  };

  // Dementor: Edit user
  const updateUser = async (id: string, userData: Partial<AppUser>) => {
    const updated = appUsers.map((u) => {
      if (u.id === id) {
        const isDem = (userData.nickname || u.nickname).toLowerCase().startsWith('dementor');
        return {
          ...u,
          ...userData,
          role: isDem ? 'dementor' : userData.role || u.role,
          updated_at: new Date().toISOString()
        };
      }
      return u;
    });
    saveUsers(updated);

    // If updating current user
    if (currentUser && currentUser.id === id) {
      const refreshed = updated.find((u) => u.id === id);
      if (refreshed) setCurrentUser(refreshed);
    }

    try {
      await fetch('/api/app-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...userData })
      });
    } catch (e) {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('app_users').update(userData).eq('id', id);
        }
      }
    }
  };

  // Dementor: Delete user
  const deleteUser = async (id: string) => {
    const updated = appUsers.filter((u) => u.id !== id);
    saveUsers(updated);

    try {
      await fetch(`/api/app-users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('app_users').delete().eq('id', id);
        }
      }
    }
  };

  // Announcement compliance sign-off
  const acknowledgeAnnouncement = (announcementId: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    
    const currentAcks = acknowledgements[announcementId] || [];
    const alreadyAcked = currentAcks.some((a) => a.userId === currentUser.id);

    if (!alreadyAcked) {
      const updatedAcks = {
        ...acknowledgements,
        [announcementId]: [...currentAcks, { userId: currentUser.id, timestamp: now }]
      };
      setAcknowledgements(updatedAcks);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ACKS, JSON.stringify(updatedAcks));
      }
    }

    const updated = announcements.map((a) => {
      if (a.id === announcementId) {
        const isCurrent = a.user_acknowledged;
        return {
          ...a,
          user_acknowledged: true,
          acknowledged_at: now,
          acknowledgements_count: isCurrent ? a.acknowledgements_count : (a.acknowledgements_count || 0) + 1
        };
      }
      return a;
    });
    saveAnnouncements(updated);
  };

  const toggleReaction = (announcementId: string, emoji: string) => {
    const updated = announcements.map((a) => {
      if (a.id === announcementId) {
        const userReactions = [...(a.user_reactions || [])];
        const summary = { ...(a.reactions_summary || {}) };
        const hasReacted = userReactions.includes(emoji);

        if (hasReacted) {
          const nextReactions = userReactions.filter((e) => e !== emoji);
          summary[emoji] = Math.max(0, (summary[emoji] || 1) - 1);
          if (summary[emoji] === 0) delete summary[emoji];
          return { ...a, user_reactions: nextReactions, reactions_summary: summary };
        } else {
          userReactions.push(emoji);
          summary[emoji] = (summary[emoji] || 0) + 1;
          return { ...a, user_reactions: userReactions, reactions_summary: summary };
        }
      }
      return a;
    });
    saveAnnouncements(updated);
  };

  const addComment = (announcementId: string, content: string) => {
    if (!currentUser) return;

    const newComment: Comment = {
      id: `cmt-${Date.now()}`,
      announcement_id: announcementId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      user: {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.nickname,
        role: isDementor ? 'super_admin' : 'viewer',
        department: currentUser.department,
        location: currentUser.location,
        avatar_url: currentUser.avatar_url,
        notification_preferences: { email_urgent: true, email_digest: true, slack_alerts: true },
        created_at: currentUser.created_at
      }
    };

    const postComments = comments[announcementId] || [];
    const nextComments = {
      ...comments,
      [announcementId]: [...postComments, newComment]
    };
    setComments(nextComments);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(nextComments));
    }

    const updated = announcements.map((a) => {
      if (a.id === announcementId) {
        return { ...a, comments_count: (a.comments_count || 0) + 1 };
      }
      return a;
    });
    saveAnnouncements(updated);
  };

  const toggleBookmark = (announcementId: string) => {
    const updated = announcements.map((a) => {
      if (a.id === announcementId) {
        return { ...a, user_bookmarked: !a.user_bookmarked };
      }
      return a;
    });
    saveAnnouncements(updated);
  };

  const togglePin = (announcementId: string) => {
    const updated = announcements.map((a) => {
      if (a.id === announcementId) {
        return { ...a, is_pinned: !a.is_pinned };
      }
      return a;
    });
    saveAnnouncements(updated);
  };

  const createAnnouncement = (data: Partial<Announcement>): Announcement => {
    const id = `ann-${Date.now()}`;
    const slug = (data.title || 'announcement')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const authorProfile: Profile = currentUser
      ? {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.nickname,
          role: isDementor ? 'super_admin' : 'contributor',
          department: currentUser.department,
          location: currentUser.location,
          avatar_url: currentUser.avatar_url,
          notification_preferences: { email_urgent: true, email_digest: true, slack_alerts: true },
          created_at: currentUser.created_at
        }
      : ({} as Profile);

    const newPost: Announcement = {
      id,
      title: data.title || 'Untitled Announcement',
      slug,
      summary: data.summary || '',
      content: data.content || '',
      category: data.category || 'GENERAL',
      priority: data.priority || 'GENERAL',
      status: data.status || 'PUBLISHED',
      is_pinned: data.is_pinned ?? false,
      requires_acknowledgement: data.requires_acknowledgement ?? false,
      allow_comments: data.allow_comments ?? true,
      target_type: data.target_type || 'ALL',
      target_value: data.target_value || null,
      scheduled_at: data.scheduled_at || new Date().toISOString(),
      expires_at: data.expires_at || null,
      attachments: data.attachments || [],
      author_id: currentUser?.id || null,
      author: authorProfile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      acknowledgements_count: 0,
      user_acknowledged: false,
      reactions_summary: {},
      user_reactions: [],
      comments_count: 0,
      user_bookmarked: false
    };

    const updated = [newPost, ...announcements];
    saveAnnouncements(updated);

    try {
      fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      }).catch((e) => console.warn('API createAnnouncement error:', e));
    } catch (e) {
      // Ignore
    }

    return newPost;
  };

  const updateAnnouncement = (id: string, data: Partial<Announcement>) => {
    const updated = announcements.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          ...data,
          updated_at: new Date().toISOString()
        };
      }
      return a;
    });
    saveAnnouncements(updated);
  };

  const deleteAnnouncement = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    saveAnnouncements(updated);
  };

  const getAuditLogs = (announcementId: string) => {
    const acks = acknowledgements[announcementId] || [];
    const ackMap = new Map<string, string>();
    acks.forEach((a) => ackMap.set(a.userId, a.timestamp));

    const records: AuditRecord[] = appUsers.map((user) => {
      const ackTimestamp = ackMap.get(user.id);
      return {
        employee_id: user.id,
        full_name: user.nickname,
        email: user.email,
        department: user.department,
        location: user.location,
        avatar_url: user.avatar_url,
        role: user.role === 'dementor' ? 'super_admin' : 'viewer',
        status: ackTimestamp ? 'acknowledged' : 'pending',
        acknowledged_at: ackTimestamp || null
      };
    });

    const acknowledged = records.filter((r) => r.status === 'acknowledged').length;
    const total = records.length;
    const rate = total > 0 ? Math.round((acknowledged / total) * 100) : 0;

    return { records, rate, total, acknowledged };
  };

  const addEvent = (eventData: Partial<CompanyEvent>): CompanyEvent => {
    const newEvent: CompanyEvent = {
      id: `evt-${Date.now()}`,
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      start_time: eventData.start_time || new Date().toISOString(),
      end_time: eventData.end_time || new Date(Date.now() + 3600 * 1000).toISOString(),
      location: eventData.location || 'Online',
      category: eventData.category || 'Town Hall',
      announcement_id: eventData.announcement_id,
      is_all_day: eventData.is_all_day ?? false,
      created_at: new Date().toISOString()
    };

    const nextEvents = [...events, newEvent];
    setEvents(nextEvents);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(nextEvents));
    }

    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      }).catch((e) => console.warn('API addEvent error:', e));
    } catch (e) {
      // Ignore
    }

    return newEvent;
  };

  return (
    <AnnouncementStoreContext.Provider
      value={{
        currentUser,
        isDementor,
        appUsers,
        announcements,
        events,
        comments,
        isOffline,
        isSupabaseLive: isSupabaseLive || isSupabaseConfigured(),
        supabaseEndpoint: getSupabaseUrl(),
        refreshData,
        connectCustomSupabase,
        login,
        setPassword,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        acknowledgeAnnouncement,
        toggleReaction,
        addComment,
        toggleBookmark,
        togglePin,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        getAuditLogs,
        addEvent
      }}
    >
      {children}
    </AnnouncementStoreContext.Provider>
  );
};

export const useAnnouncementStore = () => {
  const context = useContext(AnnouncementStoreContext);
  if (!context) {
    throw new Error('useAnnouncementStore must be used within an AnnouncementStoreProvider');
  }
  return context;
};
