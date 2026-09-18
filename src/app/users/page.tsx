'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Key,
  Copy,
  Check,
  Edit2,
  Trash2,
  ShieldAlert,
  Search,
  Building,
  MapPin,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { AppUser } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function UsersManagementPage() {
  const {
    appUsers,
    currentUser,
    isDementor,
    isSupabaseLive,
    supabaseEndpoint,
    refreshData,
    addUser,
    updateUser,
    deleteUser
  } = useAnnouncementStore();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newDept, setNewDept] = useState('Platform Engineering');
  const [newLoc, setNewLoc] = useState('Bangkok HQ');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editLoc, setEditLoc] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
    showToast('Refreshed data from Supabase database!', 'success');
  };

  // Access check
  if (!isDementor) {
    return (
      <div className="glass-panel" style={{ padding: 48, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          Dementor Access Required
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          This page is restricted to administrators whose nickname contains &quot;Dementor&quot;.
          You are currently logged in as <strong>{currentUser?.nickname || 'Guest'}</strong>.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Feed
        </Link>
      </div>
    );
  }

  const handleCopyPassword = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Password copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newNickname.trim()) {
      showToast('Please enter both company email and nickname.', 'error');
      return;
    }

    await addUser({
      email: newEmail.trim(),
      nickname: newNickname.trim(),
      department: newDept,
      location: newLoc
    });

    setShowAddModal(false);
    setNewEmail('');
    setNewNickname('');
    showToast(`Added ${newNickname} (Password initialized to NULL)!`, 'success');
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setEditNickname(user.nickname);
    setEditDept(user.department);
    setEditLoc(user.location);
    setEditPassword(user.password || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await updateUser(editingUser.id, {
      nickname: editNickname.trim(),
      department: editDept,
      location: editLoc,
      password: editPassword.trim() || null
    });

    setEditingUser(null);
    showToast(`Updated profile for ${editNickname}!`, 'success');
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove user "${name}" from the company directory?`)) {
      await deleteUser(id);
      showToast(`Removed ${name}.`, 'info');
    }
  };

  const filteredUsers = appUsers.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.nickname.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Users size={20} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Dementor User Management Console
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              Manage employee directory credentials. View plain-text passwords to assist employees who forget theirs.
            </p>
            {isSupabaseLive ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 12, background: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span>Supabase Live DB</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 12, background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                <span>Local Cache (Supabase env empty)</span>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isSupabaseLive && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary btn-sm"
              style={{ gap: 6 }}
              title="Pull latest rows from Supabase"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ gap: 8 }}
          >
            <UserPlus size={16} />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Info Notice Box */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 12,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#1e40af',
          fontSize: 13
        }}
      >
        <Key size={18} color="#2563eb" style={{ flexShrink: 0 }} />
        <div>
          <strong>Dementor Privilege Active:</strong> New users are added with <code>password: NULL</code>.
          When they first open the app and enter their email, they will be forced to set their password.
          Their active password appears below in plain text for your administrative assistance.
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by nickname, email, or department..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: 13,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ fontSize: 13, color: '#64748b' }}>
          Total Company Accounts: <strong>{appUsers.length}</strong>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 16px' }}>Employee</th>
                <th style={{ padding: '14px 16px' }}>Company Email</th>
                <th style={{ padding: '14px 16px' }}>Department & Location</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Password (Plain Text)</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                    No users match your search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const hasPassword = u.password !== null && u.password !== '';
                  const isDementorUser = u.role === 'dementor' || u.nickname.toLowerCase().includes('dementor');

                  return (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Image
                            src={u.avatar_url}
                            alt={u.nickname}
                            width={32}
                            height={32}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{u.nickname}</span>
                              {isDementorUser && (
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontWeight: 800 }}>
                                  Dementor
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{u.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 500 }}>
                        {u.email}
                      </td>

                      {/* Department & Location */}
                      <td style={{ padding: '14px 16px', color: '#64748b' }}>
                        <div>{u.department}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.location}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {hasPassword ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 12,
                              background: '#ecfdf5',
                              color: '#059669',
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            <Lock size={12} /> Active
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              borderRadius: 12,
                              background: '#fffbeb',
                              color: '#b45309',
                              fontSize: 11,
                              fontWeight: 700
                            }}
                          >
                            <Unlock size={12} /> Needs Setup (NULL)
                          </span>
                        )}
                      </td>

                      {/* Password Column in Plain Text */}
                      <td style={{ padding: '14px 16px' }}>
                        {hasPassword ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <code
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#1e1b4b'
                              }}
                            >
                              {u.password}
                            </code>
                            <button
                              onClick={() => handleCopyPassword(u.password!, u.id)}
                              style={{ padding: 4, color: '#64748b', cursor: 'pointer' }}
                              title="Copy password to tell employee"
                            >
                              {copiedId === u.id ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#d97706', fontStyle: 'italic', fontWeight: 600 }}>
                            NULL (Employee will set on 1st login)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: 6 }}
                            title="Edit employee / Reset password"
                          >
                            <Edit2 size={14} />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(u.id, u.nickname)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: 6, color: '#dc2626' }}
                              title="Delete employee"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
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
              background: '#ffffff',
              padding: 24,
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              animation: 'fadeIn 200ms ease'
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Add New Employee
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Enter company email and nickname. Password will be initialized to <strong>NULL</strong> until the employee logs in for the first time.
            </p>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Company Email *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="employee@company.com"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Employee Nickname *
                </label>
                <input
                  type="text"
                  required
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="e.g. Somchai, John, Dementor Alice"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      background: '#fff'
                    }}
                  >
                    <option value="Platform Engineering">Platform Engineering</option>
                    <option value="Product Design">Product Design</option>
                    <option value="People & HR">People & HR</option>
                    <option value="Sales & Growth">Sales & Growth</option>
                    <option value="Operations">Operations</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Office Location
                  </label>
                  <select
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      background: '#fff'
                    }}
                  >
                    <option value="Bangkok HQ">Bangkok HQ</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Tokyo">Tokyo</option>
                    <option value="Remote">Remote</option>
                  </select>
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
                  Create User (Password: NULL)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
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
              background: '#ffffff',
              padding: 24,
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              animation: 'fadeIn 200ms ease'
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Edit Employee: {editingUser.nickname}
            </h2>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {editingUser.email}
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Nickname
                </label>
                <input
                  type="text"
                  required
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Password (Visible Text)
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Set or reset employee password"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  You can directly change their password here if they forgot it.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={editLoc}
                    onChange={(e) => setEditLoc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
