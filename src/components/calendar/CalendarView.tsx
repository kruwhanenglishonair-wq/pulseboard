'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Download,
  ExternalLink,
  Plus,
  Building,
  Flag,
  Users,
  AlertTriangle,
  X,
  CalendarDays,
  List,
  Sparkles
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { downloadIcsFile, getGoogleCalendarUrl } from '@/lib/calendar';
import { useToast } from '@/components/ui/Toast';
import { CompanyEvent } from '@/lib/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView = () => {
  const { events, currentUser, addEvent } = useAnnouncementStore();
  const { showToast } = useToast();

  // Default view is MONTHLY as requested
  const [viewMode, setViewMode] = useState<'MONTH' | 'AGENDA'>('MONTH');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CompanyEvent | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Town Hall');
  const [newEventLocation, setNewEventLocation] = useState('Bangkok HQ Auditorium');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  const isAdmin = currentUser
    ? (['super_admin', 'hr_admin', 'contributor', 'dementor'].includes(currentUser.role) ||
       currentUser.nickname.toLowerCase().includes('dementor'))
    : false;

  const categories = ['ALL', 'Town Hall', 'Office Closure', 'Deadline', 'Social'];

  const filteredEvents = events.filter((evt) => {
    if (filterCategory === 'ALL') return true;
    return evt.category === filterCategory;
  });

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDownloadIcs = (event: CompanyEvent) => {
    downloadIcsFile(event);
    showToast(`Downloaded .ics for "${event.title}"`, 'success');
  };

  const openAddModalForDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setNewEventStart(`${yyyy}-${mm}-${dd}T09:00`);
    setNewEventEnd(`${yyyy}-${mm}-${dd}T10:00`);
    setShowAddModal(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      showToast('Event title is required', 'error');
      return;
    }

    addEvent({
      title: newEventTitle.trim(),
      description: newEventDescription.trim(),
      category: newEventCategory,
      location: newEventLocation.trim() || 'Company Portal',
      start_time: newEventStart ? new Date(newEventStart).toISOString() : new Date().toISOString(),
      end_time: newEventEnd ? new Date(newEventEnd).toISOString() : new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
      is_all_day: false
    });

    setShowAddModal(false);
    setNewEventTitle('');
    setNewEventDescription('');
    showToast('Event created and synchronized with calendar!', 'success');
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'Office Closure':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fca5a5',
          dot: '#ef4444'
        };
      case 'Town Hall':
        return {
          bg: '#e0e7ff',
          color: '#4338ca',
          border: '#c7d2fe',
          dot: '#6366f1'
        };
      case 'Deadline':
        return {
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          dot: '#f59e0b'
        };
      default:
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          dot: '#10b981'
        };
    }
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

  // Calendar Grid calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: Array<{
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CompanyEvent[];
  }> = [];

  const today = new Date();

  // 1. Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const date = new Date(year, month - 1, dayNumber);
    calendarDays.push({
      date,
      dayNumber,
      isCurrentMonth: false,
      isToday: false,
      events: []
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const date = new Date(year, month, d);
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d;

    // Filter events on this specific date
    const dayEvents = filteredEvents.filter((evt) => {
      const evtDate = new Date(evt.start_time);
      return (
        evtDate.getFullYear() === year &&
        evtDate.getMonth() === month &&
        evtDate.getDate() === d
      );
    });

    calendarDays.push({
      date,
      dayNumber: d,
      isCurrentMonth: true,
      isToday,
      events: dayEvents
    });
  }

  // 3. Next month trailing days to complete 35 or 42 grid slots
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  const totalSlotsNeeded = calendarDays.length + remainingCells < 35 ? 35 - calendarDays.length : remainingCells;
  for (let d = 1; d <= totalSlotsNeeded; d++) {
    const date = new Date(year, month + 1, d);
    calendarDays.push({
      date,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: false,
      events: []
    });
  }

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Top Header & Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Company Calendar & Schedules
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Stay aligned with all-hands meetings, holidays, office closures, and compliance deadlines.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* View Mode Toggle: Monthly is Default */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: 4,
              borderRadius: 10,
              gap: 4
            }}
          >
            <button
              onClick={() => setViewMode('MONTH')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                background: viewMode === 'MONTH' ? '#ffffff' : 'transparent',
                color: viewMode === 'MONTH' ? 'var(--brand-primary)' : '#64748b',
                boxShadow: viewMode === 'MONTH' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 120ms ease'
              }}
            >
              <CalendarDays size={16} />
              <span>Month View</span>
            </button>

            <button
              onClick={() => setViewMode('AGENDA')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                background: viewMode === 'AGENDA' ? '#ffffff' : 'transparent',
                color: viewMode === 'AGENDA' ? 'var(--brand-primary)' : '#64748b',
                boxShadow: viewMode === 'AGENDA' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 120ms ease'
              }}
            >
              <List size={16} />
              <span>Agenda List</span>
            </button>
          </div>

          {/* Add Event Button */}
          {isAdmin && (
            <button
              onClick={() => {
                const now = new Date();
                openAddModalForDate(now);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px' }}
            >
              <Plus size={16} />
              <span>Add Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Month Navigator & Category Filters */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}
      >
        {/* Month Navigator Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                transition: 'all 120ms ease'
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                transition: 'all 120ms ease'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', minWidth: 170 }}>
            {monthName}
          </h2>

          <button
            onClick={handleToday}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}
          >
            Today
          </button>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: filterCategory === cat ? 700 : 600,
                background: filterCategory === cat ? 'var(--brand-primary)' : '#f8fafc',
                color: filterCategory === cat ? '#ffffff' : '#64748b',
                border: filterCategory === cat ? '1px solid var(--brand-primary)' : '1px solid #e2e8f0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 120ms ease'
              }}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. MONTHLY CALENDAR GRID VIEW (DEFAULT)                         */}
      {/* ============================================================== */}
      {viewMode === 'MONTH' && (
        <div
          className="glass-panel"
          style={{
            background: '#ffffff',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
          }}
        >
          {/* Weekday Names Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: idx === 0 || idx === 6 ? '#94a3b8' : '#475569'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#e2e8f0',
              gap: 1
            }}
          >
            {calendarDays.map((cell, idx) => {
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (cell.isCurrentMonth) {
                      openAddModalForDate(cell.date);
                    }
                  }}
                  style={{
                    background: cell.isCurrentMonth ? '#ffffff' : '#f8fafc',
                    minHeight: 110,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    cursor: cell.isCurrentMonth ? 'pointer' : 'default',
                    opacity: cell.isCurrentMonth ? 1 : 0.45,
                    transition: 'background 120ms ease'
                  }}
                >
                  {/* Date Number Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: cell.isToday ? 800 : 600,
                        background: cell.isToday ? 'var(--brand-primary)' : 'transparent',
                        color: cell.isToday ? '#ffffff' : '#1e293b'
                      }}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.events.length > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#64748b'
                        }}
                      >
                        {cell.events.length} {cell.events.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Events on this day */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
                    {cell.events.slice(0, 3).map((evt) => {
                      const styles = getCategoryStyles(evt.category);
                      const timeStr = new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          style={{
                            padding: '3px 6px',
                            borderRadius: 6,
                            background: styles.bg,
                            borderLeft: `3px solid ${styles.dot}`,
                            color: styles.color,
                            fontSize: 11,
                            fontWeight: 700,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}
                          title={`${evt.title} (${timeStr})`}
                        >
                          <span style={{ fontSize: 10, opacity: 0.85, flexShrink: 0 }}>{timeStr}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.title}</span>
                        </div>
                      );
                    })}

                    {cell.events.length > 3 && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#64748b',
                          paddingLeft: 4,
                          marginTop: 2
                        }}
                      >
                        +{cell.events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. AGENDA LIST VIEW (ALTERNATE)                                 */}
      {/* ============================================================== */}
      {viewMode === 'AGENDA' && (
        <div>
          {filteredEvents.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: 48,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}
            >
              <CalendarIcon size={36} color="var(--text-muted)" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                No events scheduled
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                There are no scheduled company events matching the selected category.
              </p>
              {isAdmin && (
                <button
                  onClick={() => openAddModalForDate(new Date())}
                  className="btn btn-primary"
                  style={{ marginTop: 8 }}
                >
                  <Plus size={16} />
                  <span>Create First Event</span>
                </button>
              )}
            </div>
          ) : (
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
                      borderTop: '3px solid var(--brand-primary)',
                      background: '#ffffff'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        {getCategoryBadge(evt.category)}
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-secondary)' }}>
                          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                        <span>Save .ics</span>
                      </button>

                      <a
                        href={getGoogleCalendarUrl(evt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ gap: 6, fontSize: 12 }}
                      >
                        <ExternalLink size={13} />
                        <span>Google Cal</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EVENT DETAILS & EXPORT                                  */}
      {/* ============================================================== */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>{getCategoryBadge(selectedEvent.category)}</div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>
              {selectedEvent.title}
            </h3>

            {selectedEvent.description && (
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
                {selectedEvent.description}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '14px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                marginBottom: 20,
                fontSize: 13,
                color: '#334155'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--brand-primary)" />
                <span>
                  {new Date(selectedEvent.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {' • '}
                  {new Date(selectedEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(selectedEvent.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="var(--brand-primary)" />
                <span>{selectedEvent.location}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => handleDownloadIcs(selectedEvent)}
                className="btn btn-secondary"
                style={{ gap: 6, fontSize: 13 }}
              >
                <Download size={14} />
                <span>Export .ics</span>
              </button>

              <a
                href={getGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ gap: 6, fontSize: 13 }}
              >
                <ExternalLink size={14} />
                <span>Add to Google Cal</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD COMPANY EVENT                                       */}
      {/* ============================================================== */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarIcon size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Schedule Company Event</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Q3 Town Hall & AMA"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      background: '#fff'
                    }}
                  >
                    <option value="Town Hall">Town Hall</option>
                    <option value="Office Closure">Office Closure</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Social">Social</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="Bangkok HQ / Zoom"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Key agenda points, dial-in link, or notes..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save & Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
