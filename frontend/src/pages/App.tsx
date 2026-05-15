import React, { useEffect, useRef, useState } from 'react';
import { ChatWidget } from '../components/ChatWidget';
import { HrDashboard } from './HrDashboard';
import { RatingsDashboard } from './RatingsDashboard';

function getRoute() {
  const hash = window.location.hash || '#/';
  if (hash.startsWith('#/hr')) return 'hr';
  if (hash.startsWith('#/ratings')) return 'ratings';
  return 'chat';
}

const HR_PASS_STORAGE_KEY = 'hr_dashboard_password_v1';

export const App: React.FC = () => {
  const [route, setRoute] = useState(getRoute());
  const [showHrGate, setShowHrGate] = useState(false);
  const [gateTarget, setGateTarget] = useState<'hr' | 'ratings'>('hr');
  const [hrPass, setHrPass] = useState(() => {
    try {
      return sessionStorage.getItem(HR_PASS_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [hrGateError, setHrGateError] = useState<string | null>(null);
  const prevRouteRef = useRef(route);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Default to same-origin `/api` (works with Vite dev proxy + Vercel single-app deploy).
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  const clearHrPass = () => {
    try {
      sessionStorage.removeItem(HR_PASS_STORAGE_KEY);
    } catch {
      // ignore
    }
    setHrPass('');
  };

  useEffect(() => {
    const prev = prevRouteRef.current;
    if ((prev === 'hr' || prev === 'ratings') && route === 'chat') {
      // Leaving/closing an HR-protected page: remove saved password for security.
      clearHrPass();
    }
    prevRouteRef.current = route;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const verifyAndEnterHr = async () => {
    const p = hrPass.trim();
    if (!p) {
      setHrGateError('Password is required.');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/hr/auth-check`, {
        headers: {
          Authorization: `Bearer demo-token`,
          'x-user-id': 'demo-hr',
          'x-user-role': 'hr',
          'x-hr-dashboard-password': p,
        },
      });

      if (!res.ok) {
        // On wrong password, backend replies 401.
        if (res.status === 401) {
          setHrGateError('Wrong password');
          // Clear it so user can re-enter.
          clearHrPass();
          return;
        }
        throw new Error(await res.text());
      }

      try {
        sessionStorage.setItem(HR_PASS_STORAGE_KEY, p);
      } catch {
        // ignore
      }
      setHrGateError(null);
      setShowHrGate(false);
      window.location.hash = gateTarget === 'ratings' ? '#/ratings' : '#/hr';
    } catch (e) {
      setHrGateError(
        e instanceof Error ? e.message : 'Failed to verify password',
      );
    }
  };

  if (route === 'hr' || route === 'ratings') {
    if (!hrPass.trim()) {
      // Block access if user navigated directly without a password.
      window.location.hash = '#/';
      return null;
    }
    if (route === 'ratings') {
      return (
        <RatingsDashboard
          apiBaseUrl={apiBaseUrl}
          authToken="demo-token"
          userId="demo-hr"
          hrDashboardPassword={hrPass}
          onLock={() => {
            clearHrPass();
            window.location.hash = '#/';
          }}
        />
      );
    }
    return (
      <HrDashboard
        apiBaseUrl={apiBaseUrl}
        authToken="demo-token"
        userId="demo-hr"
        hrDashboardPassword={hrPass}
        onLock={() => {
          clearHrPass();
          window.location.hash = '#/';
        }}
      />
    );
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(900px 500px at 20% 10%, rgba(59,130,246,0.22) 0%, rgba(30,58,138,0.10) 45%, rgba(2,6,23,0.0) 70%), ' +
            'radial-gradient(800px 500px at 85% 35%, rgba(34,211,238,0.14) 0%, rgba(30,64,175,0.08) 45%, rgba(2,6,23,0.0) 72%), ' +
            'linear-gradient(180deg, #070b1a 0%, #050816 55%, #040510 100%)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: 'min(820px, 92vw)',
            color: '#e5e7eb',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              borderRadius: 24,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow:
                '0 18px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              padding: '34px 28px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* subtle gold accent */}
            <div
              style={{
                position: 'absolute',
                inset: -2,
                background:
                  'radial-gradient(800px 260px at 50% 0%, rgba(245,158,11,0.22) 0%, rgba(245,158,11,0.00) 70%)',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'rgba(2,6,23,0.45)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 10px 28px rgba(0,0,0,0.32)',
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: '#f59e0b',
                  boxShadow: '0 0 0 4px rgba(245,158,11,0.14)',
                }}
              />
              <div style={{ fontSize: 12, color: '#e2e8f0' }}>
                Recruitment with AI • Premium screening demo
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                fontSize: 44,
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: -1.2,
                margin: '0 auto',
                background:
                  'linear-gradient(180deg, #ffffff 0%, #dbeafe 35%, #fde68a 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 10px 30px rgba(0,0,0,0.35)',
              }}
            >
              AI Recruitment Assistant
            </div>

            <div
              style={{
                position: 'relative',
                marginTop: 10,
                color: '#cbd5e1',
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 560,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Chat to explore roles, upload your CV, and get instant approval/rejection.
              <br />
              Designed for a smooth candidate experience and fast HR review.
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', left: 24, top: 24, zIndex: 9999 }}>
        <button
          type="button"
          onClick={() => {
            setHrGateError(null);
            setGateTarget('ratings');
            setShowHrGate(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 999,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#ffffff',
            fontSize: 12,
            textDecoration: 'none',
            boxShadow:
              '0 14px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#f59e0b',
              boxShadow: '0 0 0 4px rgba(245,158,11,0.18)',
            }}
          />
          Ratings Dashboard
        </button>
      </div>

      <div style={{ position: 'fixed', left: 24, bottom: 24, zIndex: 9999 }}>
        <button
          type="button"
          onClick={() => {
            setHrGateError(null);
            setGateTarget('hr');
            setShowHrGate(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 999,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#ffffff',
            fontSize: 12,
            textDecoration: 'none',
            boxShadow:
              '0 14px 36px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#f59e0b',
              boxShadow: '0 0 0 4px rgba(245,158,11,0.18)',
            }}
          />
          HR Dashboard
        </button>
      </div>

      {showHrGate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
          }}
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowHrGate(false);
          }}
        >
          <div
            style={{
              width: 'min(520px, 92vw)',
              borderRadius: 18,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow:
                '0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
              padding: 18,
              color: '#e5e7eb',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, letterSpacing: -0.2, fontSize: 16 }}>
                  HR Dashboard Access
                </div>
                <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>
                  Enter the HR password to open the dashboard.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHrGate(false);
                  setHrGateError(null);
                  clearHrPass();
                }}
                style={{
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(2,6,23,0.35)',
                  color: '#e5e7eb',
                  borderRadius: 10,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <input
                type="password"
                value={hrPass}
                placeholder="HR password"
                onChange={e => setHrPass(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void verifyAndEnterHr();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(2,6,23,0.35)',
                  color: '#e5e7eb',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  void verifyAndEnterHr();
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(245,158,11,0.35)',
                  background:
                    'linear-gradient(180deg, rgba(245,158,11,0.95) 0%, rgba(217,119,6,0.95) 100%)',
                  color: '#111827',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 14px 30px rgba(245,158,11,0.18)',
                }}
              >
                Continue
              </button>
            </div>

            {hrGateError && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: '#fecaca',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {hrGateError}
              </div>
            )}
          </div>
        </div>
      )}
      <ChatWidget
        apiBaseUrl={apiBaseUrl}
        authToken="demo-token"
        userId="demo-user"
        userRole="candidate"
      />
    </>
  );
};

