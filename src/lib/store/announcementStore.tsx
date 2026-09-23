'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Announcement,
  Profile,
  CompanyEvent,
  Comment,
  AuditRecord,
  AppUser,
  Department
} from '../types';
import { MOCK_ANNOUNCEMENTS, MOCK_EVENTS, MOCK_COMMENTS, MOCK_APP_USERS, DEFAULT_DEPARTMENTS } from '../mockData';
import { getSupabaseClient, isSupabaseConfigured, getSupabaseUrl, setSupabaseConfig, cleanSupabaseUrl, cleanSupabaseKey } from '../supabase';
import { updateAppBadge } from '@/lib/notifications';

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

  // Department Management
  departments: Department[];
  addDepartment: (deptData: { name: string; description?: string; color?: string; icon?: string }) => Promise<Department>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

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

  // Unread & Notice Tracking (Per User)
  unreadCount: number;
  unreadAnnouncements: Announcement[];
  readAnnouncementIds: string[];
  markAsRead: (announcementId: string) => void;
  markAllAsRead: () => void;
  isAnnouncementRead: (announcementId: string) => boolean;
}

const AnnouncementStoreContext = createContext<AnnouncementStoreContextType | null>(null);

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const STORAGE_KEYS = {
  USERS: 'powerhouse_users_v1',
  AUTH_USER: 'powerhouse_auth_user_v1', // localStorage (Remember Me)
  SESSION_USER: 'powerhouse_session_user_v1', // sessionStorage
  ANNOUNCEMENTS: 'powerhouse_announcements_v1',
  COMMENTS: 'powerhouse_comments_v1',
  EVENTS: 'powerhouse_events_v1',
  ACKS: 'powerhouse_acks_v1',
  DEPARTMENTS: 'powerhouse_departments_v1',
  READ_PREFIX: 'powerhouse_read_announcements_'
};

export const AnnouncementStoreProvider = ({ children }: { children: ReactNode }) => {
  const [appUsers, setAppUsers] = useState<AppUser[]>(MOCK_APP_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [events, setEvents] = useState<CompanyEvent[]>(MOCK_EVENTS);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [acknowledgements, setAcknowledgements] = useState<Record<string, Array<{ userId: string; timestamp: string }>>>({});
  const [isOffline, setIsOffline] = useState(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);

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
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS) || localStorage.getItem('pulseboard_users_v3');
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
      const persistentUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER) || localStorage.getItem('pulseboard_auth_user_v3');
      const sessionUser = sessionStorage.getItem(STORAGE_KEYS.SESSION_USER) || sessionStorage.getItem('pulseboard_session_user_v3');
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
      const storedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || localStorage.getItem('pulseboard_announcements_v3');
      if (storedAnnouncements) setAnnouncements(JSON.parse(storedAnnouncements));

      const storedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS) || localStorage.getItem('pulseboard_comments_v3');
      if (storedComments) setComments(JSON.parse(storedComments));

      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS) || localStorage.getItem('pulseboard_events_v3');
      if (storedEvents) setEvents(JSON.parse(storedEvents));

      const storedAcks = localStorage.getItem(STORAGE_KEYS.ACKS) || localStorage.getItem('pulseboard_acks_v3');
      if (storedAcks) setAcknowledgements(JSON.parse(storedAcks));

      // Load read announcement IDs for initial/current user
      const userKey = persistentUser ? JSON.parse(persistentUser).id : 'guest';
      const storedRead = localStorage.getItem(`${STORAGE_KEYS.READ_PREFIX}${userKey}`);
      if (storedRead) {
        try {
          setReadAnnouncementIds(JSON.parse(storedRead));
        } catch (e) {
          setReadAnnouncementIds([]);
        }
      }

      // 4. Load departments from storage
      const storedDepts = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      if (storedDepts) {
        try {
          const parsed = JSON.parse(storedDepts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDepartments(parsed);
          }
        } catch (e) {
          setDepartments(DEFAULT_DEPARTMENTS);
        }
      }

      // Check for locally saved custom credentials (useful when testing on localhost)
      const customUrl = localStorage.getItem('powerhouse_supabase_url') || localStorage.getItem('pulseboard_supabase_url');
      const customKey = localStorage.getItem('powerhouse_supabase_key') || localStorage.getItem('pulseboard_supabase_key');
      if (customUrl && customKey) {
        const cleanedUrl = cleanSupabaseUrl(customUrl);
        const cleanedKey = cleanSupabaseKey(customKey);
        localStorage.setItem('powerhouse_supabase_url', cleanedUrl);
        localStorage.setItem('powerhouse_supabase_key', cleanedKey);
        setSupabaseConfig(cleanedUrl, cleanedKey);
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
      const supabase = getSupabaseClient();

      // 1. Fetch live users: query Supabase directly if configured
      if (supabase && isSupabaseConfigured()) {
        const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setIsSupabaseLive(true);
          setAppUsers(data);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data));
          }
        }
      } else {
        const usersRes = await fetch('/api/app-users').then((r) => r.json()).catch(() => null);
        if (usersRes && usersRes.success && Array.isArray(usersRes.users) && usersRes.users.length > 0) {
          setIsSupabaseLive(true);
          setAppUsers(usersRes.users);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersRes.users));
          }
        }
      }

      // 2. Fetch live announcements
      if (supabase && isSupabaseConfigured()) {
        const { data, error } = await supabase.from('announcements').select('*').order('scheduled_at', { ascending: false });
        if (!error && data) {
          setAnnouncements(data as any);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(data));
          }
        }
      } else {
        const annRes = await fetch('/api/announcements').then((r) => r.json()).catch(() => null);
        if (annRes && annRes.success && Array.isArray(annRes.announcements)) {
          setAnnouncements(annRes.announcements);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(annRes.announcements));
          }
        }
      }

      // 3. Fetch live company events
      if (supabase && isSupabaseConfigured()) {
        const { data, error } = await supabase.from('company_events').select('*').order('start_time', { ascending: true });
        if (!error && data) {
          setEvents(data as any);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data));
          }
        }
      } else {
        const eventsRes = await fetch('/api/events').then((r) => r.json()).catch(() => null);
        if (eventsRes && eventsRes.success && Array.isArray(eventsRes.events)) {
          setEvents(eventsRes.events);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventsRes.events));
          }
        }
      }

      // 4. Fetch live departments
      if (supabase && isSupabaseConfigured()) {
        const { data, error } = await supabase.from('departments').select('*').order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          setDepartments(data as any);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(data));
          }
        }
      } else {
        const deptsRes = await fetch('/api/departments').then((r) => r.json()).catch(() => null);
        if (deptsRes && deptsRes.success && Array.isArray(deptsRes.departments) && deptsRes.departments.length > 0) {
          setDepartments(deptsRes.departments);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(deptsRes.departments));
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

  const saveDepartments = (depts: Department[]) => {
    setDepartments(depts);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(depts));
    }
  };

  // Connect custom Supabase credentials from UI (for localhost)
  const connectCustomSupabase = (url: string, key: string): boolean => {
    if (url && key && url.trim() && key.trim()) {
      const cleanUrl = cleanSupabaseUrl(url);
      const cleanKey = cleanSupabaseKey(key);
      if (typeof window !== 'undefined') {
        localStorage.setItem('powerhouse_supabase_url', cleanUrl);
        localStorage.setItem('powerhouse_supabase_key', cleanKey);
      }
      setSupabaseConfig(cleanUrl, cleanKey);
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
        if (serverErrorMessage.includes('Invalid path') || serverErrorMessage.includes('Invalid URL')) {
          return {
            success: false,
            message: `Database error: "${serverErrorMessage}". Your Supabase URL must be only "https://<project-ref>.supabase.co" without any "/rest/v1" or trailing slash.`
          };
        }
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
      localStorage.removeItem('pulseboard_auth_user_v3');
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_USER);
      sessionStorage.removeItem('pulseboard_session_user_v3');
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
      id: generateUUID(),
      email: userData.email.trim(),
      nickname: userData.nickname.trim(),
      password: null, // Initialized as NULL per requirements
      role: isDem ? 'dementor' : 'employee',
      department: userData.department || 'General',
      location: userData.location || 'Bangkok HQ',
      avatar_url: `https://images.unsplash.com/photo-${1534528741775 + (appUsers.length % 5)}?w=160&fit=crop&crop=faces`,
      created_at: new Date().toISOString()
    };

    let saved = false;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('app_users').insert([{
          id: newUser.id,
          email: newUser.email,
          nickname: newUser.nickname,
          password: newUser.password,
          role: newUser.role,
          department: newUser.department,
          location: newUser.location,
          avatar_url: newUser.avatar_url,
          created_at: newUser.created_at
        }]);
        if (error) {
          console.error('Supabase addUser error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        saved = true;
      }
    }

    if (!saved) {
      try {
        const res = await fetch('/api/app-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok && json.error && !json.error.includes('not configured')) {
          throw new Error(`Database error: ${json.error}`);
        }
      } catch (err: any) {
        if (err.message?.startsWith('Database error:')) throw err;
      }
    }

    const updated = [newUser, ...appUsers.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase())];
    saveUsers(updated);
    return newUser;
  };

  // Dementor: Edit user
  const updateUser = async (id: string, userData: Partial<AppUser>) => {
    let saved = false;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { id: _id, ...fieldsToUpdate } = userData;
        const { error } = await supabase.from('app_users').update(fieldsToUpdate).eq('id', id);
        if (error) {
          console.error('Supabase updateUser error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        saved = true;
      }
    }

    if (!saved) {
      try {
        const res = await fetch('/api/app-users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...userData })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok && json.error && !json.error.includes('not configured')) {
          throw new Error(`Database error: ${json.error}`);
        }
      } catch (err: any) {
        if (err.message?.startsWith('Database error:')) throw err;
      }
    }

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

    if (currentUser && currentUser.id === id) {
      const refreshed = updated.find((u) => u.id === id);
      if (refreshed) setCurrentUser(refreshed);
    }
  };

  // Dementor: Delete user
  const deleteUser = async (id: string) => {
    let deleted = false;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('app_users').delete().eq('id', id);
        if (error) {
          console.error('Supabase deleteUser error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        deleted = true;
      }
    }

    if (!deleted) {
      try {
        const res = await fetch(`/api/app-users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok && json.error && !json.error.includes('not configured')) {
          throw new Error(`Database error: ${json.error}`);
        }
      } catch (err: any) {
        if (err.message?.startsWith('Database error:')) throw err;
      }
    }

    const updated = appUsers.filter((u) => u.id !== id);
    saveUsers(updated);
  };

  // Department Management: Add
  const addDepartment = async (deptData: { name: string; description?: string; color?: string; icon?: string }): Promise<Department> => {
    const newDept: Department = {
      id: generateUUID(),
      name: deptData.name.trim(),
      description: deptData.description?.trim() || '',
      color: deptData.color || '#3b82f6',
      icon: deptData.icon || 'Layers',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const next = [...departments, newDept];
    saveDepartments(next);

    // Sync to Supabase / API
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase.from('departments').insert([newDept]).select().single();
          if (!error && data) {
            const updated = next.map((d) => (d.id === newDept.id ? data : d));
            saveDepartments(updated);
            return data;
          }
        }
      } else {
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDept)
        });
        const json = await res.json().catch(() => ({}));
        if (json.success && json.department) {
          const updated = next.map((d) => (d.id === newDept.id ? json.department : d));
          saveDepartments(updated);
          return json.department;
        }
      }
    } catch (e) {
      console.warn('Department sync warning:', e);
    }

    return newDept;
  };

  // Department Management: Update
  const updateDepartment = async (id: string, updates: Partial<Department>): Promise<void> => {
    const next = departments.map((d) => (d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d));
    saveDepartments(next);

    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('departments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
        }
      } else {
        await fetch('/api/departments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates })
        });
      }
    } catch (e) {
      console.warn('Department update warning:', e);
    }
  };

  // Department Management: Delete
  const deleteDepartment = async (id: string): Promise<void> => {
    const next = departments.filter((d) => d.id !== id);
    saveDepartments(next);

    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('departments').delete().eq('id', id);
        }
      } else {
        await fetch(`/api/departments?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      }
    } catch (e) {
      console.warn('Department delete warning:', e);
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

      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          supabase.from('acknowledgements').insert([{
            announcement_id: announcementId,
            user_id: currentUser.id,
            acknowledged_at: now
          }]).then(({ error }) => {
            if (error) console.warn('Supabase acknowledge error:', error);
          });
        }
      }
    }

    // Automatically mark as noticed/read when acknowledged
    markAsRead(announcementId);

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
    let hasReacted = false;
    const updated = announcements.map((a) => {
      if (a.id === announcementId) {
        const userReactions = [...(a.user_reactions || [])];
        const summary = { ...(a.reactions_summary || {}) };
        hasReacted = userReactions.includes(emoji);

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

    if (isSupabaseConfigured() && currentUser) {
      const supabase = getSupabaseClient();
      if (supabase) {
        if (hasReacted) {
          supabase.from('reactions').delete().match({
            announcement_id: announcementId,
            user_id: currentUser.id,
            emoji
          }).then(({ error }) => {
            if (error) console.warn('Supabase reaction delete error:', error);
          });
        } else {
          supabase.from('reactions').insert([{
            announcement_id: announcementId,
            user_id: currentUser.id,
            emoji
          }]).then(({ error }) => {
            if (error) console.warn('Supabase reaction insert error:', error);
          });
        }
      }
    }
  };

  const addComment = (announcementId: string, content: string) => {
    if (!currentUser) return;

    const newComment: Comment = {
      id: generateUUID(),
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

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('comments').insert([{
          id: newComment.id,
          announcement_id: announcementId,
          user_id: currentUser.id,
          content
        }]).then(({ error }) => {
          if (error) console.warn('Supabase comment insert error:', error);
        });
      }
    }
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
    let nextPinned = false;
    const updated = announcements.map((a) => {
      if (a.id === announcementId) {
        nextPinned = !a.is_pinned;
        return { ...a, is_pinned: nextPinned };
      }
      return a;
    });
    saveAnnouncements(updated);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('announcements').update({ is_pinned: nextPinned }).eq('id', announcementId).then(({ error }) => {
          if (error) console.warn('Supabase pin update error:', error);
        });
      }
    }
  };

  const createAnnouncement = (data: Partial<Announcement>): Announcement => {
    const id = generateUUID();
    const slug = `${(data.title || 'announcement')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')}-${Date.now().toString().slice(-4)}`;

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

    const dbRecord = {
      id: newPost.id,
      title: newPost.title,
      slug: newPost.slug,
      summary: newPost.summary,
      content: newPost.content,
      category: newPost.category,
      priority: newPost.priority,
      status: newPost.status,
      is_pinned: newPost.is_pinned,
      requires_acknowledgement: newPost.requires_acknowledgement,
      allow_comments: newPost.allow_comments,
      target_type: newPost.target_type,
      target_value: newPost.target_value,
      scheduled_at: newPost.scheduled_at,
      expires_at: newPost.expires_at,
      attachments: newPost.attachments,
      author_id: currentUser?.id || null
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('announcements').insert([dbRecord]).then(({ error }) => {
          if (error) console.error('Supabase direct createAnnouncement error:', error);
        });
      }
    } else {
      fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbRecord)
      }).catch((e) => console.warn('API createAnnouncement error:', e));
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

    const dbUpdate: any = {};
    if (data.title !== undefined) dbUpdate.title = data.title;
    if (data.summary !== undefined) dbUpdate.summary = data.summary;
    if (data.content !== undefined) dbUpdate.content = data.content;
    if (data.category !== undefined) dbUpdate.category = data.category;
    if (data.priority !== undefined) dbUpdate.priority = data.priority;
    if (data.status !== undefined) dbUpdate.status = data.status;
    if (data.is_pinned !== undefined) dbUpdate.is_pinned = data.is_pinned;
    if (data.requires_acknowledgement !== undefined) dbUpdate.requires_acknowledgement = data.requires_acknowledgement;
    if (data.allow_comments !== undefined) dbUpdate.allow_comments = data.allow_comments;
    if (data.target_type !== undefined) dbUpdate.target_type = data.target_type;
    if (data.target_value !== undefined) dbUpdate.target_value = data.target_value;
    if (data.scheduled_at !== undefined) dbUpdate.scheduled_at = data.scheduled_at;
    if (data.expires_at !== undefined) dbUpdate.expires_at = data.expires_at;
    if (data.attachments !== undefined) dbUpdate.attachments = data.attachments;
    dbUpdate.updated_at = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('announcements').update(dbUpdate).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase direct updateAnnouncement error:', error);
        });
      }
    }
  };

  const deleteAnnouncement = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    saveAnnouncements(updated);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('announcements').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase direct deleteAnnouncement error:', error);
        });
      }
    }
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
      id: generateUUID(),
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

    const dbEvent = {
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description,
      start_time: newEvent.start_time,
      end_time: newEvent.end_time,
      location: newEvent.location,
      category: newEvent.category,
      is_all_day: newEvent.is_all_day
    };

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('company_events').insert([dbEvent]).then(({ error }) => {
          if (error) console.error('Supabase direct addEvent error:', error);
        });
      }
    } else {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbEvent)
      }).catch((e) => console.warn('API addEvent error:', e));
    }

    return newEvent;
  };

  // Sync read IDs whenever current user changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userKey = currentUser ? currentUser.id : 'guest';
    const stored = localStorage.getItem(`${STORAGE_KEYS.READ_PREFIX}${userKey}`);
    if (stored) {
      try {
        setReadAnnouncementIds(JSON.parse(stored));
      } catch (e) {
        setReadAnnouncementIds([]);
      }
    } else {
      setReadAnnouncementIds([]);
    }
  }, [currentUser]);

  // Compute unread announcements for current user
  const unreadAnnouncements = announcements.filter((a) => {
    if (a.status !== 'PUBLISHED') return false;

    // Check scheduled publish date
    const publishTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : new Date(a.created_at).getTime();
    if (publishTime > Date.now()) return false;

    // Audience targeting
    if (currentUser) {
      if (a.target_type === 'DEPARTMENT' && a.target_value && a.target_value !== currentUser.department) {
        return false;
      }
      if (a.target_type === 'LOCATION' && a.target_value && a.target_value !== currentUser.location) {
        return false;
      }
    }

    // If already acknowledged, it is noticed
    const userAcked = acknowledgements[a.id]?.some((ack) => ack.userId === currentUser?.id) || a.user_acknowledged;
    if (userAcked) return false;

    // Is it in user's read list?
    return !readAnnouncementIds.includes(a.id);
  });

  const unreadCount = unreadAnnouncements.length;

  // Whenever unread count changes or app regains focus/visibility, sync native mobile app icon badge!
  useEffect(() => {
    updateAppBadge(unreadCount);

    const handleSyncBadge = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        updateAppBadge(unreadCount);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleSyncBadge);
      window.addEventListener('focus', handleSyncBadge);
      return () => {
        document.removeEventListener('visibilitychange', handleSyncBadge);
        window.removeEventListener('focus', handleSyncBadge);
      };
    }
  }, [unreadCount]);

  const markAsRead = (announcementId: string) => {
    setReadAnnouncementIds((prev) => {
      if (prev.includes(announcementId)) return prev;
      const next = [...prev, announcementId];
      if (typeof window !== 'undefined') {
        const userKey = currentUser ? currentUser.id : 'guest';
        localStorage.setItem(`${STORAGE_KEYS.READ_PREFIX}${userKey}`, JSON.stringify(next));
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allPublishedIds = announcements
      .filter((a) => a.status === 'PUBLISHED')
      .map((a) => a.id);
    setReadAnnouncementIds(allPublishedIds);
    if (typeof window !== 'undefined') {
      const userKey = currentUser ? currentUser.id : 'guest';
      localStorage.setItem(`${STORAGE_KEYS.READ_PREFIX}${userKey}`, JSON.stringify(allPublishedIds));
    }
    updateAppBadge(0);
  };

  const isAnnouncementRead = (announcementId: string): boolean => {
    if (readAnnouncementIds.includes(announcementId)) return true;
    if (currentUser && acknowledgements[announcementId]?.some((ack) => ack.userId === currentUser.id)) return true;
    return false;
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
        departments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        acknowledgeAnnouncement,
        toggleReaction,
        addComment,
        toggleBookmark,
        togglePin,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        getAuditLogs,
        addEvent,
        unreadCount,
        unreadAnnouncements,
        readAnnouncementIds,
        markAsRead,
        markAllAsRead,
        isAnnouncementRead
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
