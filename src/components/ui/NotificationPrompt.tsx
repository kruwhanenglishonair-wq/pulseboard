'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Smartphone } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission
} from '@/lib/notifications';
import { useToast } from '@/components/ui/Toast';

export const NotificationPrompt = () => {
  const { showToast } = useToast();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('granted');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) {
      setPermission('unsupported');
      return;
    }
    const current = getNotificationPermission();
    setPermission(current);
    const isDismissed = sessionStorage.getItem('powerhouse_dismiss_notif_prompt');
    if (isDismissed) setDismissed(true);
  }, []);

  const handleEnable = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      showToast('🔔 Mobile notifications enabled! You will receive alerts when announcements publish.', 'success');
      setDismissed(true);
    } else {
      showToast('Notifications were not granted. Please check browser settings.', 'error');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('powerhouse_dismiss_notif_prompt', 'true');
  };

  if (permission === 'granted' || permission === 'unsupported' || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: 14,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
        animation: 'fadeIn 250ms ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            flexShrink: 0,
            boxShadow: '0 3px 8px var(--brand-glow)'
          }}
        >
          <Bell size={18} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
            Enable Mobile Alerts & Scheduled Notifications
          </div>
          <div style={{ fontSize: 12, color: '#475569' }}>
            Receive instant lock screen alerts when announcements publish and scheduled updates arrive.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleEnable}
          className="btn btn-primary btn-sm"
          style={{ padding: '6px 14px', fontSize: 12, borderRadius: 8, gap: 6 }}
        >
          <Smartphone size={14} />
          <span>Turn On Alerts</span>
        </button>

        <button
          onClick={handleDismiss}
          style={{ color: '#64748b', padding: 4, cursor: 'pointer' }}
          aria-label="Dismiss notification prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
