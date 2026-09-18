'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  UserCheck,
  Building2
} from 'lucide-react';
import { useAnnouncementStore } from '@/lib/store/announcementStore';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, setPassword } = useAnnouncementStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // First-time setup state
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetUserNickname, setTargetUserNickname] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    const result = login(email, password, rememberMe);

    if (result.requiresPasswordSetup && result.user) {
      setIsFirstTimeSetup(true);
      setTargetUserNickname(result.user.nickname);
      setLoading(false);
      showToast('First-time login detected! Please set your new password.', 'info');
      return;
    }

    if (!result.success) {
      setLoading(false);
      showToast(result.message || 'Login failed', 'error');
      return;
    }

    showToast(`Welcome back, ${result.user?.nickname}!`, 'success');
    setLoading(false);
    router.push('/');
  };

  const handleSetupPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Please enter a password', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    const result = setPassword(email, newPassword, rememberMe);
    showToast(`Account activated! Welcome, ${result.user.nickname}`, 'success');
    setLoading(false);
    router.push('/');
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '36px 32px',
          animation: 'fadeIn 300ms ease'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--brand-gradient)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px var(--brand-glow)',
              marginBottom: 14
            }}
          >
            <Sparkles size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 6 }}>
            PulseBoard Portal
          </h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Internal Company Announcement & Compliance Hub
          </p>
        </div>

        {/* Regular Login or First-time password setup */}
        {!isFirstTimeSetup ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email Field */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Company Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: 14,
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Password
                </label>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  (Leave empty if 1st time)
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '11px 42px 11px 40px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: 14,
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', padding: 4 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 10, marginTop: 6 }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to PulseBoard'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* First-Time Password Creation Screen */
          <form onSubmit={handleSetupPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontSize: 13,
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <KeyRound size={18} />
              <span>
                Hello <strong>{targetUserNickname}</strong>! Welcome to the company. Please set your password to activate your account.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Create New Password
              </label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 14,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Confirm Password
              </label>
              <input
                type="text"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 14,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 10, marginTop: 6 }}
            >
              <ShieldCheck size={18} />
              <span>Activate Account & Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFirstTimeSetup(false)}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Enterprise Security Footer */}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}>
            <Building2 size={14} />
            <span>Authorized company personnel only</span>
          </div>
          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>
            Contact your Dementor Admin for onboarding or password retrieval
          </div>
        </div>
      </div>
    </div>
  );
}
