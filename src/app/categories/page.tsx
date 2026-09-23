'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  HeartHandshake,
  Video,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  BookOpen,
  PlusCircle,
  Pencil,
  Trash2,
  Users,
  Search,
  Check,
  X,
  Code,
  Palette,
  TrendingUp,
  Building2,
  Briefcase,
  Globe,
  Megaphone,
  AlertTriangle,
  Coffee,
  Radio
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { useToast } from '@/components/ui/Toast';
import { Department } from '@/lib/types';

const ICON_MAP: Record<string, React.ElementType> = {
  Code,
  Palette,
  HeartHandshake,
  TrendingUp,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  Briefcase,
  Globe,
  Coffee,
  Megaphone,
  Video,
  Radio
};

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Rose', value: '#f43f5e' }
];

export default function CategoryHubsPage() {
  const {
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    announcements,
    appUsers,
    isDementor
  } = useAnnouncementStore();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'CATEGORIES'>('DEPARTMENTS');
  const [searchQuery, setSearchQuery] = useState('');

  // Department Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formIcon, setFormIcon] = useState('Layers');

  // Hardcoded Category Knowledge Hubs
  const categoryHubs = [
    {
      id: 'HR',
      title: 'People & HR Hub',
      description: 'Official employment policies, benefits enrollment, holiday calendars, and onboarding guides.',
      icon: HeartHandshake,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)',
      resources: [
        { title: 'Global Employee Handbook 2026', link: '#' },
        { title: 'Health Insurance & Wellness Benefits', link: '#' },
        { title: 'Parental & Sabbatical Leave Policy', link: '#' }
      ]
    },
    {
      id: 'IT_SECURITY',
      title: 'IT & Security Operations',
      description: 'SOC2 protocols, identity verification, 2FA hardware guides, and device provisioning.',
      icon: ShieldCheck,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      resources: [
        { title: '2FA & 1Password Setup Guide', link: '#' },
        { title: 'Global Wireguard VPN Credentials', link: '#' },
        { title: 'Report Security Incident / Phishing', link: '#' }
      ]
    },
    {
      id: 'TOWN_HALL',
      title: 'Town Hall & Leadership',
      description: 'Quarterly executive addresses, company milestones, financial earnings, and open AMAs.',
      icon: Video,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      resources: [
        { title: 'Q3 2026 Executive Presentation Deck', link: '#' },
        { title: 'Slido AMA Anonymous Submission Portal', link: '#' },
        { title: 'Town Hall Recording Archive', link: '#' }
      ]
    },
    {
      id: 'EVENTS',
      title: 'Events & Culture Hub',
      description: 'Tech talks, hackathons, lunch & learns, office social gatherings, and sports clubs.',
      icon: Sparkles,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      resources: [
        { title: 'Friday Pizza & Tech Talk Schedule', link: '#' },
        { title: 'Bangkok HQ Badminton Club Sign-up', link: '#' },
        { title: 'Annual Hackathon Registration', link: '#' }
      ]
    }
  ];

  // Helper to open Add Modal
  const openAddModal = () => {
    setFormName('');
    setFormDescription('');
    setFormColor('#3b82f6');
    setFormIcon('Layers');
    setShowAddModal(true);
  };

  // Helper to open Edit Modal
  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormDescription(dept.description || '');
    setFormColor(dept.color || '#3b82f6');
    setFormIcon(dept.icon || 'Layers');
  };

  // Submit Add Department
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Department name is required', 'error');
      return;
    }

    // Check duplicate name
    const exists = departments.some(
      (d) => d.name.toLowerCase() === formName.trim().toLowerCase()
    );
    if (exists) {
      showToast(`A department named "${formName.trim()}" already exists`, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDepartment({
        name: formName.trim(),
        description: formDescription.trim(),
        color: formColor,
        icon: formIcon
      });
      showToast(`Department "${formName.trim()}" created successfully!`, 'success');
      setShowAddModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to create department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Department
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    if (!formName.trim()) {
      showToast('Department name is required', 'error');
      return;
    }

    // Check duplicate name on another department
    const exists = departments.some(
      (d) => d.id !== editingDept.id && d.name.toLowerCase() === formName.trim().toLowerCase()
    );
    if (exists) {
      showToast(`A department named "${formName.trim()}" already exists`, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDepartment(editingDept.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        color: formColor,
        icon: formIcon
      });
      showToast(`Department "${formName.trim()}" updated successfully!`, 'success');
      setEditingDept(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete Department
  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    try {
      setIsSubmitting(true);
      await deleteDepartment(deletingDept.id);
      showToast(`Department "${deletingDept.name}" deleted`, 'info');
      setDeletingDept(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Departments
  const filteredDepartments = departments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Top Header */}
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
            Department & Category Hubs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Manage company departments, browse specialized team hubs, and access category guidelines.
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'DEPARTMENTS' && (
          <button
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            <PlusCircle size={18} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 10
        }}
      >
        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'DEPARTMENTS' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'DEPARTMENTS' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 150ms ease'
          }}
        >
          <Building2 size={16} />
          <span>Company Departments</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              background: activeTab === 'DEPARTMENTS' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              color: activeTab === 'DEPARTMENTS' ? '#ffffff' : '#475569'
            }}
          >
            {departments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CATEGORIES')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'CATEGORIES' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'CATEGORIES' ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 150ms ease'
          }}
        >
          <Layers size={16} />
          <span>Knowledge & Policy Hubs</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              background: activeTab === 'CATEGORIES' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              color: activeTab === 'CATEGORIES' ? '#ffffff' : '#475569'
            }}
          >
            {categoryHubs.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: COMPANY DEPARTMENTS (CRUD + See Announcements button)   */}
      {/* ============================================================== */}
      {activeTab === 'DEPARTMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
              <Search
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: 14,
                  outline: 'none',
                  color: '#0f172a'
                }}
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 12px' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Departments Grid */}
          {filteredDepartments.length === 0 ? (
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
              <Building2 size={36} color="var(--text-muted)" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                No departments found
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {searchQuery ? `No department matching "${searchQuery}"` : 'Create your first department to get started.'}
              </p>
              <button onClick={openAddModal} className="btn btn-primary" style={{ marginTop: 8 }}>
                <PlusCircle size={16} />
                <span>Add Department</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20
              }}
            >
              {filteredDepartments.map((dept) => {
                const IconComponent = ICON_MAP[dept.icon || 'Layers'] || Layers;
                const deptColor = dept.color || '#3b82f6';

                // Compute member count from appUsers
                const memberCount = appUsers.filter(
                  (u) => u.department && u.department.toLowerCase() === dept.name.toLowerCase()
                ).length;

                // Compute announcement count
                const deptAnnouncementsCount = announcements.filter((a) => {
                  if (a.status !== 'PUBLISHED') return false;
                  const matchesTarget = a.target_value && a.target_value.toLowerCase() === dept.name.toLowerCase();
                  const matchesAuthor = a.author?.department && a.author.department.toLowerCase() === dept.name.toLowerCase();
                  return matchesTarget || matchesAuthor;
                }).length;

                return (
                  <div
                    key={dept.id}
                    className="glass-panel-elevated"
                    style={{
                      padding: 22,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 18,
                      borderTop: `4px solid ${deptColor}`,
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Card Header: Icon & Action buttons */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: `${deptColor}1a`,
                            color: deptColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${deptColor}33`
                          }}
                        >
                          <IconComponent size={24} />
                        </div>

                        {/* Edit and Delete Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={() => openEditModal(dept)}
                            title="Edit Department"
                            style={{
                              padding: '6px 8px',
                              borderRadius: 8,
                              background: '#f1f5f9',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 120ms ease'
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingDept(dept)}
                            title="Delete Department"
                            style={{
                              padding: '6px 8px',
                              borderRadius: 8,
                              background: '#fee2e2',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'all 120ms ease'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Department Name & Description */}
                      <h2
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          marginBottom: 6,
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {dept.name}
                      </h2>
                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          marginBottom: 16,
                          minHeight: 38
                        }}
                      >
                        {dept.description || 'Dedicated department hub and announcement channel.'}
                      </p>

                      {/* Stats Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 14,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#475569'
                          }}
                        >
                          <Users size={13} color="var(--brand-primary)" />
                          <span>{memberCount} {memberCount === 1 ? 'Member' : 'Members'}</span>
                        </div>

                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 14,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#475569'
                          }}
                        >
                          <Megaphone size={13} color={deptColor} />
                          <span>{deptAnnouncementsCount} {deptAnnouncementsCount === 1 ? 'Announcement' : 'Announcements'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent "See Announcements" Button */}
                    <Link
                      href={`/?department=${encodeURIComponent(dept.name)}`}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '11px',
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${deptColor}, ${deptColor}dd)`,
                        boxShadow: `0 4px 12px ${deptColor}33`,
                        border: 'none',
                        color: '#ffffff'
                      }}
                    >
                      <span>See {dept.name} Announcements</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: KNOWLEDGE & POLICY HUBS (HR, IT, Town Hall, Events)      */}
      {/* ============================================================== */}
      {activeTab === 'CATEGORIES' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20
          }}
        >
          {categoryHubs.map((hub) => {
            const Icon = hub.icon;
            const postCount = announcements.filter((a) => a.category === hub.id && a.status === 'PUBLISHED').length;

            return (
              <div
                key={hub.id}
                className="glass-panel-elevated"
                style={{
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: hub.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={24} color={hub.color} />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 12,
                        background: 'var(--bg-surface-elevated)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {postCount} {postCount === 1 ? 'Notice' : 'Notices'}
                    </span>
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                    {hub.title}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                    {hub.description}
                  </p>

                  {/* Useful links & resources */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                      Quick Resources
                    </div>
                    {hub.resources.map((res, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <BookOpen size={12} color="var(--brand-secondary)" />
                        <span>{res.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feed Link CTA */}
                <Link
                  href={`/?category=${hub.id}`}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', fontSize: 13 }}
                >
                  <span>View All {hub.title.split(' ')[0]} Updates</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD DEPARTMENT                                          */}
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
              maxWidth: 520,
              background: '#ffffff',
              borderRadius: 16,
              padding: 26,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${formColor}22`,
                    color: formColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Add Company Department</h3>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Create a new team channel and announcement hub</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Department Name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. AI Research, Customer Success, Legal..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Description / Mission
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Briefly describe this department's primary responsibilities..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Theme Color Picker */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Brand Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      title={c.name}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: c.value,
                        border: formColor === c.value ? '3px solid #0f172a' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        transition: 'transform 100ms ease'
                      }}
                    >
                      {formColor === c.value && <Check size={16} strokeWidth={3} />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Department Icon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const Comp = ICON_MAP[iconKey];
                    const isSelected = formIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormIcon(iconKey)}
                        title={iconKey}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          border: isSelected ? `2px solid ${formColor}` : '1px solid #e2e8f0',
                          background: isSelected ? `${formColor}1a` : '#f8fafc',
                          color: isSelected ? formColor : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 120ms ease'
                        }}
                      >
                        <Comp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ background: formColor, borderColor: formColor }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT DEPARTMENT                                         */}
      {/* ============================================================== */}
      {editingDept && (
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
              maxWidth: 520,
              background: '#ffffff',
              borderRadius: 16,
              padding: 26,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${formColor}22`,
                    color: formColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Edit Department</h3>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Modify department info, color, and icon</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Department Name */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Description / Mission
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none',
                    color: '#0f172a',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Theme Color Picker */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Brand Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      title={c.name}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: c.value,
                        border: formColor === c.value ? '3px solid #0f172a' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}
                    >
                      {formColor === c.value && <Check size={16} strokeWidth={3} />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Department Icon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const Comp = ICON_MAP[iconKey];
                    const isSelected = formIcon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormIcon(iconKey)}
                        title={iconKey}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          border: isSelected ? `2px solid ${formColor}` : '1px solid #e2e8f0',
                          background: isSelected ? `${formColor}1a` : '#f8fafc',
                          color: isSelected ? formColor : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Comp size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ background: formColor, borderColor: formColor }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                     */}
      {/* ============================================================== */}
      {deletingDept && (
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
              maxWidth: 420,
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Delete "{deletingDept.name}"?
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to remove this department from the company registry? Team members currently in this department will remain unaffected.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={isSubmitting}
                style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
