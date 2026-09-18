'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Announcement,
  Profile,
  CompanyEvent,
  Comment,
  AuditRecord,
  AnnouncementCategory,
  AnnouncementPriority
} from '../types';
import { MOCK_PROFILES, MOCK_ANNOUNCEMENTS, MOCK_EVENTS, MOCK_COMMENTS } from '../mockData';

interface AnnouncementStoreContextType {
  currentUser: Profile;
  switchUser: (userId: string) => void;
  allProfiles: Profile[];
  announcements: Announcement[];
  events: CompanyEvent[];
  comments: Record<string, Comment[]>;
  isOffline: boolean;
  
  // Actions
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
  ANNOUNCEMENTS: 'pulseboard_announcements_v1',
  CURRENT_USER_ID: 'pulseboard_current_user_id_v1',
  COMMENTS: 'pulseboard_comments_v1',
  EVENTS: 'pulseboard_events_v1',
  ACKS: 'pulseboard_acks_v1'
};

export const AnnouncementStoreProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Profile>(MOCK_PROFILES[0]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [events, setEvents] = useState<CompanyEvent[]>(MOCK_EVENTS);
  const [comments, setComments] = useState<Record<string, Comment[]>>({
    'ann-001': MOCK_COMMENTS
  });
  // Map of announcementId -> Array of { userId, timestamp }
  const [acknowledgements, setAcknowledgements] = useState<Record<string, Array<{ userId: string; timestamp: string }>>>({
    'ann-001': [
      { userId: 'user-001', timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString() },
      { userId: 'user-002', timestamp: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString() },
      { userId: 'user-003', timestamp: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString() }
    ]
  });
  const [isOffline, setIsOffline] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect offline/online
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!window.navigator.onLine);

    try {
      const storedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (storedAnnouncements) {
        setAnnouncements(JSON.parse(storedAnnouncements));
      }

      const storedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (storedUserId) {
        const found = MOCK_PROFILES.find((p) => p.id === storedUserId);
        if (found) setCurrentUser(found);
      }

      const storedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
      }

      const storedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }

      const storedAcks = localStorage.getItem(STORAGE_KEYS.ACKS);
      if (storedAcks) {
        setAcknowledgements(JSON.parse(storedAcks));
      }
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage when state changes
  const saveAnnouncements = (items: Announcement[]) => {
    setAnnouncements(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(items));
    }
  };

  const switchUser = (userId: string) => {
    const target = MOCK_PROFILES.find((p) => p.id === userId);
    if (target) {
      setCurrentUser(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
      }
    }
  };

  const acknowledgeAnnouncement = (announcementId: string) => {
    const now = new Date().toISOString();
    
    // Update local acks state
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

    // Update announcement computed count
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
    const newComment: Comment = {
      id: `cmt-${Date.now()}`,
      announcement_id: announcementId,
      user_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      user: currentUser
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

    // Bump comment count on announcement
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
      author_id: currentUser.id,
      author: currentUser,
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

    const records: AuditRecord[] = MOCK_PROFILES.map((profile) => {
      const ackTimestamp = ackMap.get(profile.id);
      return {
        employee_id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        department: profile.department,
        location: profile.location,
        avatar_url: profile.avatar_url,
        role: profile.role,
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
    return newEvent;
  };

  return (
    <AnnouncementStoreContext.Provider
      value={{
        currentUser,
        switchUser,
        allProfiles: MOCK_PROFILES,
        announcements,
        events,
        comments,
        isOffline,
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
