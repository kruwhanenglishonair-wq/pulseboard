'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Download,
  ExternalLink,
  Plus,
  Building,
  Flag,
  Users,
  AlertTriangle
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { downloadIcsFile, getGoogleCalendarUrl } from '@/lib/calendar';
import { useToast } from '@/components/ui/Toast';
import { CompanyEvent } from '@/lib/types';

export const CalendarView = () => {
  const { events, currentUser, addEvent } = useAnnouncementStore();
  const { showToast } = useToast();

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Town Hall');
  const [newEventLocation, setNewEventLocation] = useState('Bangkok HQ Auditorium');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');

  const isAdmin = ['super_admin', 'hr_admin', 'contributor'].includes(currentUser.role);

  const categories = ['ALL', 'Town Hall', 'Office Closure', 'Deadline', 'Social'];

  const filteredEvents = events.filter((evt) => {
    if (filterCategory === 'ALL') return true;
    return evt.category === filterCategory;
  });

  const handleDownloadIcs = (event: CompanyEvent) => {
    downloadIcsFile(event);
    showToast(`Downloaded .ics for "${event.title}"`, 'success');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    addEvent({
      title: newEventTitle,
      category: newEventCategory,
      location: newEventLocation,
      start_time: newEventStart ? new Date(newEventStart).toISOString() : new Date().toISOString(),
      end_time: newEventEnd ? new Date(newEventEnd).toISOString() : new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
      is_all_day: false
    });

    setShowAddModal(false);
    setNewEventTitle('');
    showToast('Event created and synchronized with calendar!', 'success');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Office Closure':
        return <span className="badge badge-urgent"><AlertTriangle size={12} /> Office Closure</span>;
      case 'Town Hall':
        return <span className="badge badge-important"><Users size={12} /> Town Hall</span>;
      case 'Deadline':
        return <span className="badge badge-urgent"><Flag size={12} /> Compliance Deadline</span>;
      default:
        return <span className="badge badge-general"><Building size={12} /> Social / Tech</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header & Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Company Calendar & Schedules
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Stay aligned with all-hands meetings, holidays, office closures, and compliance deadlines.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: filterCategory === cat ? 700 : 500,
              background: filterCategory === cat ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
              color: filterCategory === cat ? '#fff' : 'var(--text-secondary)',
              border: filterCategory === cat ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {cat === 'ALL' ? 'All Events' : cat}
          </button>
        ))}
      </div>

      {/* Events List / Agenda Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredEvents.map((evt) => {
          const startDate = new Date(evt.start_time);
          const endDate = new Date(evt.end_time);

          return (
            <div
              key={evt.id}
              className="glass-panel-elevated"
              style={{
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                borderTop: '3px solid var(--brand-primary)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  {getCategoryBadge(evt.category)}
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-secondary)' }}>
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {evt.title}
                </h3>

                {evt.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    {evt.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="var(--text-secondary)" />
                    <span>
                      {evt.is_all_day
                        ? 'All-Day Event'
                        : `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ICT`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="var(--text-secondary)" />
                    <span>{evt.location}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: .ics download + Google Calendar link */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 14,
                  borderTop: '1px solid var(--border-subtle)'
                }}
              >
                <button
                  onClick={() => handleDownloadIcs(evt)}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6, fontSize: 12 }}
                  title="Export .ics calendar file"
                >
                  <Download size={13} />
                  <span>.ICS File</span>
                </button>

                <a
                  href={getGoogleCalendarUrl(evt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ gap: 6, fontSize: 12, color: 'var(--brand-secondary)' }}
                  title="Add to Google Calendar"
                >
                  <ExternalLink size={13} />
                  <span>Google Cal</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--bg-surface)',
              padding: 24,
              borderRadius: 'var(--radius-lg)',
              animation: 'fadeIn 200ms ease'
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Schedule New Company Event</h2>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Q4 Town Hall Meeting"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff'
                    }}
                  >
                    <option value="Town Hall">Town Hall</option>
                    <option value="Office Closure">Office Closure</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="Bangkok HQ / Zoom"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
