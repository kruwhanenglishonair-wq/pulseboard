'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  BellRing,
  Smartphone,
  Volume2,
  Clock,
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  Send,
  Sparkles
} from 'lucide-react';
import { Announcement } from '@/lib/types';
import {
  dispatchSystemNotification,
  playNotificationSound,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationSupported,
  NotificationPermissionStatus,
  updateAppBadge,
  clearAppBadge,
  sendPushNotificationToAllDevices
} from '@/lib/notifications';
import { useToast } from '@/components/ui/Toast';

interface TestNotificationModalProps {
  announcement: Announcement;
  isOpen: boolean;
  onClose: () => void;
}

export const TestNotificationModal: React.FC<TestNotificationModalProps> = ({
  announcement,
  isOpen,
  onClose
}) => {
  const { showToast } = useToast();

  const defaultIsUrgent = announcement.priority === 'URGENT';
  const defaultTitle = `${defaultIsUrgent ? '🚨 URGENT: ' : '📢 '}${announcement.title}`;
  const defaultBody = `[${announcement.category}] ${announcement.summary || announcement.content.slice(0, 120)}`;

  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [isUrgent, setIsUrgent] = useState(defaultIsUrgent);
  const [delaySeconds, setDelaySeconds] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state when announcement changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const urgent = announcement.priority === 'URGENT';
      setTitle(`${urgent ? '🚨 URGENT: ' : '📢 '}${announcement.title}`);
      setBody(`[${announcement.category}] ${announcement.summary || announcement.content.slice(0, 120)}`);
      setIsUrgent(urgent);
      setDelaySeconds(0);
      setCountdown(null);
      setPermission(getNotificationPermission());
    }
  }, [isOpen, announcement]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  if (!isOpen || !mounted) return null;

  const handleReset = () => {
    const urgent = announcement.priority === 'URGENT';
    setTitle(`${urgent ? '🚨 URGENT: ' : '📢 '}${announcement.title}`);
    setBody(`[${announcement.category}] ${announcement.summary || announcement.content.slice(0, 120)}`);
    setIsUrgent(urgent);
    setDelaySeconds(0);
  };

  const handleTestAudio = () => {
    setIsPlayingAudio(true);
    playNotificationSound(isUrgent);
    setTimeout(() => setIsPlayingAudio(false), 800);
  };

  const [deviceStats, setDeviceStats] = useState<{ total: number; mobile: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/push/subscribe')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setDeviceStats({ total: data.totalDevices, mobile: data.mobileDevices });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      showToast('Notification permission granted! You can now send test alerts to this device.', 'success');
    } else {
      showToast('Notifications are blocked or not supported on this browser.', 'error');
    }
  };

  const triggerNotificationNow = async () => {
    // 1. Dispatch locally on current machine
    dispatchSystemNotification(title, {
      body,
      url: `/announcements/${announcement.id}`,
      tag: `test-ticket-${announcement.id}-${Date.now()}`,
      isUrgent,
      broadcastToRemoteDevices: false
    });

    // 2. Broadcast Web Push to all connected mobile devices via cloud server!
    try {
      const pushRes = await sendPushNotificationToAllDevices(title, {
        body,
        url: `/announcements/${announcement.id}`,
        tag: `test-ticket-${announcement.id}-${Date.now()}`,
        isUrgent
      });

      if (pushRes.success && pushRes.sentCount > 0) {
        showToast(
          `🚀 Alert pushed to ${pushRes.sentCount} device(s) including connected mobile phones! Check your phone.`,
          'success'
        );
      } else {
        showToast(
          '📱 Alert triggered locally! (To receive alerts on your phone when clicking on PC: open Powerhouse on your phone once & tap "Set Badge" or "Turn On Alerts")',
          'info'
        );
      }
    } catch (e) {
      showToast('📱 Alert triggered on device.', 'success');
    }
    setCountdown(null);
  };

  const handleSendTest = () => {
    // Proceed with send immediately so PC can trigger Web Push to mobile even if PC hasn't enabled local notifications
    proceedWithSend();

    // If local permission not granted, gently prompt
    if (permission !== 'granted' && isNotificationSupported()) {
      requestNotificationPermission().then((res) => {
        setPermission(res);
      });
    }
  };

  const proceedWithSend = () => {
    if (delaySeconds === 0) {
      triggerNotificationNow();
    } else {
      // Start countdown
      setCountdown(delaySeconds);
      showToast(`⏱️ Alert scheduled in ${delaySeconds} seconds! Lock your phone screen now to test lock-screen alert.`, 'info');

      let currentSec = delaySeconds;
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = setInterval(() => {
        currentSec -= 1;
        setCountdown(currentSec);

        if (currentSec <= 0) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          triggerNotificationNow();
        }
      }, 1000);
    }
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    showToast('Test notification timer cancelled.', 'info');
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 180ms ease',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && countdown === null) {
          onClose();
        }
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.25)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 220ms ease'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--brand-gradient)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px var(--brand-glow)'
              }}
            >
              <BellRing size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Test Mobile Alert
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Customize & trigger push alert for this ticket
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={countdown !== null}
            style={{
              padding: 6,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: countdown !== null ? 'not-allowed' : 'pointer'
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}
        >
          {/* Permission Status Callout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 12,
              background: permission === 'granted' ? 'var(--success-bg)' : '#fffbeb',
              border: `1px solid ${permission === 'granted' ? 'var(--success-border)' : '#fde68a'}`,
              fontSize: 12,
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {permission === 'granted' ? (
                <>
                  <Check size={16} color="var(--success)" />
                  <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>
                    Mobile Alerts Ready (Permission Granted)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} color="#d97706" />
                  <span style={{ color: '#b45309', fontWeight: 600 }}>
                    Alert Permission Required on this device
                  </span>
                </>
              )}
            </div>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="btn btn-primary btn-sm"
                style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6 }}
              >
                Enable Alerts
              </button>
            )}
          </div>

          {/* Cloud Push Device Status Callout (PC -> Mobile) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 12,
              background: deviceStats && deviceStats.mobile > 0 ? '#ecfdf5' : '#f0f9ff',
              border: `1px solid ${deviceStats && deviceStats.mobile > 0 ? '#a7f3d0' : '#bae6fd'}`,
              fontSize: 12,
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={16} color={deviceStats && deviceStats.mobile > 0 ? '#059669' : '#0284c7'} />
              <div>
                <div style={{ fontWeight: 700, color: deviceStats && deviceStats.mobile > 0 ? '#065f46' : '#0369a1' }}>
                  {deviceStats && deviceStats.mobile > 0
                    ? `📱 ${deviceStats.mobile} Mobile Phone(s) Connected for Push`
                    : '📱 Cross-Device Push (PC → Mobile)'}
                </div>
                <div style={{ fontSize: 11, color: deviceStats && deviceStats.mobile > 0 ? '#047857' : '#0c4a6e' }}>
                  {deviceStats && deviceStats.mobile > 0
                    ? 'Triggering this alert will send a Web Push notification to your connected mobile phone!'
                    : 'To get alerts on your phone when clicking on PC: Open Powerhouse on your phone once & tap "Set Badge" or "Turn On Alerts".'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await fetch('/api/push/subscribe').then((r) => r.json()).catch(() => ({}));
                if (res.success) {
                  setDeviceStats({ total: res.totalDevices, mobile: res.mobileDevices });
                  showToast(`📡 Connected devices: ${res.mobileDevices} mobile, ${res.totalDevices} total`, 'info');
                }
              }}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#ffffff',
                cursor: 'pointer',
                color: '#475569',
                fontWeight: 600
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* Live Mobile Lock Screen Preview Card */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8
              }}
            >
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Smartphone size={14} /> Live Phone Alert Preview
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                As displayed on lock screen
              </span>
            </div>

            <div
              style={{
                background: '#0f172a',
                borderRadius: 16,
                padding: '14px 16px',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle top glare effect */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)'
                }}
              />

              {/* Notification Header: App Icon & Name */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: 'var(--brand-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#ffffff'
                    }}
                  >
                    P
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8' }}>
                    POWERHOUSE
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>now</span>
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#f8fafc',
                  lineHeight: 1.35
                }}
              >
                {title || '(No title entered)'}
              </div>

              {/* Body */}
              <div
                style={{
                  fontSize: 12,
                  color: '#cbd5e1',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {body || '(No message body entered)'}
              </div>

              {/* Bottom hint */}
              <div
                style={{
                  fontSize: 10,
                  color: '#64748b',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>👉 Tap opens ticket:</span>
                <span style={{ color: '#94a3b8' }}>/announcements/{announcement.id.slice(0, 10)}...</span>
              </div>
            </div>
          </div>

          {/* Customization Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Title Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Alert Title
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {title.length}/80 chars
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter alert title..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-page)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Body Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Alert Message Body
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {body.length}/200 chars
                </span>
              </div>
              <textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter alert message body..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-page)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Urgency & Audio Chime Selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Tone & Urgency
                </label>
                <button
                  type="button"
                  onClick={handleTestAudio}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '3px 8px',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                  title="Preview audio chime through device speaker"
                >
                  <Volume2 size={12} />
                  <span>{isPlayingAudio ? 'Playing...' : 'Test Sound'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Standard Option */}
                <button
                  type="button"
                  onClick={() => setIsUrgent(false)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: !isUrgent ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    background: !isUrgent ? 'rgba(99, 102, 241, 0.06)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📢 Standard Chime</span>
                    {!isUrgent && <Check size={14} color="var(--brand-primary)" />}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Melodic 2-tone chime
                  </span>
                </button>

                {/* Urgent Option */}
                <button
                  type="button"
                  onClick={() => setIsUrgent(true)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: isUrgent ? '2px solid var(--urgent-base)' : '1px solid var(--border-subtle)',
                    background: isUrgent ? 'var(--urgent-bg)' : 'var(--bg-surface-elevated)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: isUrgent ? 'var(--urgent-text)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🚨 Urgent Alert</span>
                    {isUrgent && <Check size={14} color="var(--urgent-base)" />}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    High-priority 3-tone siren
                  </span>
                </button>
              </div>
            </div>

            {/* Delay Selector - Crucial for Phone Lock Screen Testing */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={14} /> Send Delay (For Lock Screen Testing)
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { sec: 0, label: '⚡ Now', hint: 'Instant alert' },
                  { sec: 5, label: '⏱️ In 5s', hint: 'Lock screen test' },
                  { sec: 10, label: '⏱️ In 10s', hint: 'App switch test' }
                ].map(({ sec, label, hint }) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDelaySeconds(sec)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: delaySeconds === sec ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: delaySeconds === sec ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: delaySeconds === sec ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {hint}
                    </div>
                  </button>
                ))}
              </div>
              {delaySeconds > 0 && (
                <div style={{ fontSize: 11, color: 'var(--brand-secondary)', marginTop: 6, fontWeight: 500 }}>
                  💡 Tip: Tap "Send Test Alert", then immediately lock your phone screen or go to home screen to test how the notification pops up!
                </div>
              )}
            </div>

            {/* Native Mobile App Icon Badge Testing */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.08) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    1
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                    Home Screen Mobile Icon Red Badge
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#b91c1c' }}>
                  Web Badging API
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#7f1d1d', margin: 0, lineHeight: 1.4 }}>
                Tests the native red circle count badge displayed on your phone's home screen PWA icon for unread notices.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (isNotificationSupported() && Notification.permission !== 'granted') {
                      await requestNotificationPermission();
                    }
                    await updateAppBadge(1);
                    await sendPushNotificationToAllDevices('🔴 Powerhouse: 1 New Notice', {
                      body: 'You have 1 unread announcement. Tap to open.',
                      tag: 'powerhouse-unread-badge'
                    });
                    showToast('🔴 Home screen app icon badge set to 1! Dispatched to connected mobile phone(s).', 'success');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: 11, background: '#ffffff' }}
                >
                  Set Badge: 1
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isNotificationSupported() && Notification.permission !== 'granted') {
                      await requestNotificationPermission();
                    }
                    await updateAppBadge(5);
                    await sendPushNotificationToAllDevices('🔴 Powerhouse: 5 New Notices', {
                      body: 'You have 5 unread announcements. Tap to open.',
                      tag: 'powerhouse-unread-badge'
                    });
                    showToast('🔴 Home screen app icon badge set to 5! Dispatched to connected mobile phone(s).', 'success');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: 11, background: '#ffffff' }}
                >
                  Set Badge: 5
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await clearAppBadge();
                    showToast('Cleared home screen app icon badge.', 'info');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: 11, background: '#ffffff', color: '#64748b' }}
                >
                  Clear Badge
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#991b1b', lineHeight: 1.4, background: '#fee2e2', padding: '6px 8px', borderRadius: 6, marginTop: 4 }}>
                💡 <strong>Android Note:</strong> Android launchers (Xiaomi MIUI/HyperOS, Samsung, Pixel) display the red dot badge on the home screen icon when an active notice is in the notification bar. Make sure Notifications are allowed and <em>Settings &gt; Notifications &gt; App icon badges</em> is turned ON.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap'
          }}
        >
          {countdown !== null ? (
            /* Countdown In-Progress View */
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pulsating-dot" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-primary)' }}>
                  Sending in {countdown}s... Lock your screen now!
                </span>
              </div>
              <button
                type="button"
                onClick={cancelCountdown}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: 11 }}
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Standard Action Buttons */
            <>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary btn-sm"
                style={{ gap: 5, color: 'var(--text-muted)' }}
                title="Reset to ticket values"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary btn-sm"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSendTest}
                  className="btn btn-primary btn-sm"
                  style={{ gap: 6, padding: '8px 16px', fontWeight: 700 }}
                >
                  <Send size={14} />
                  <span>
                    {delaySeconds > 0 ? `Start ${delaySeconds}s Test` : 'Send Test Alert Now'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
