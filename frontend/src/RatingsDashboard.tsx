import React, { useEffect, useMemo, useState } from 'react';

type RatingsSummary = {
  count: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

type ChatRating = {
  id: string;
  sessionId: string;
  userId: string;
  stars: number;
  createdAt: string;
};

export const RatingsDashboard: React.FC<{
  apiBaseUrl: string;
  authToken: string;
  userId: string;
  hrDashboardPassword: string;
  onLock: () => void;
}> = ({ apiBaseUrl, authToken, userId, hrDashboardPassword, onLock }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RatingsSummary | null>(null);
  const [rows, setRows] = useState<ChatRating[]>([]);
  const [starFilter, setStarFilter] = useState<number | ''>('');

  const filtered = useMemo(() => {
    return rows.filter(r => (starFilter === '' ? true : r.stars === starFilter));
  }, [rows, starFilter]);

  const headers = {
    Authorization: `Bearer ${authToken}`,
    'x-user-id': userId,
    'x-user-role': 'hr',
    'x-hr-dashboard-password': hrDashboardPassword,
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const sRes = await fetch(`${apiBaseUrl}/api/hr/chat-ratings/summary`, { headers });
      if (!sRes.ok) {
        if (sRes.status === 401) {
          setError('Wrong password');
          onLock();
          return;
        }
        throw new Error(await sRes.text());
      }
      setSummary((await sRes.json()) as RatingsSummary);

      const rRes = await fetch(`${apiBaseUrl}/api/hr/chat-ratings`, { headers });
      if (!rRes.ok) {
        if (rRes.status === 401) {
          setError('Wrong password');
          onLock();
          return;
        }
        throw new Error(await rRes.text());
      }
      setRows((await rRes.json()) as ChatRating[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const downloadRatings = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/hr/chat-ratings/export`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Wrong password');
          onLock();
          return;
        }
        throw new Error(await res.text());
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chat_ratings.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e instanceof Error ? `Failed to download ratings: ${e.message}` : 'Failed to download ratings');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = summary?.count ?? 0;
  const avg = summary?.average ?? null;
  const dist = summary?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        background:
          'radial-gradient(900px 500px at 15% 10%, rgba(59,130,246,0.22) 0%, rgba(30,58,138,0.10) 45%, rgba(2,6,23,0.0) 70%), ' +
          'radial-gradient(800px 500px at 85% 35%, rgba(245,158,11,0.16) 0%, rgba(30,64,175,0.08) 45%, rgba(2,6,23,0.0) 72%), ' +
          'linear-gradient(180deg, #070b1a 0%, #050816 55%, #040510 100%)',
        color: '#e5e7eb',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, letterSpacing: -0.6 }}>Ratings Dashboard</h2>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
              Average: {avg === null ? '—' : `${avg}/5`} • Total ratings: {count}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={downloadRatings}
              disabled={loading}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(2,6,23,0.35)',
                color: '#e5e7eb',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: 12,
                boxShadow: '0 12px 26px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(10px)',
              }}
            >
              Save all ratings
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(245,158,11,0.35)',
                background:
                  'linear-gradient(180deg, rgba(245,158,11,0.95) 0%, rgba(217,119,6,0.95) 100%)',
                color: '#111827',
                fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 14px 30px rgba(245,158,11,0.18)',
              }}
            >
              Refresh
            </button>
            <a
              href="#/"
              style={{
                alignSelf: 'center',
                fontSize: 12,
                color: '#e5e7eb',
                textDecoration: 'none',
                padding: '8px 10px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              ← Back
            </a>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(239,68,68,0.16)',
              border: '1px solid rgba(239,68,68,0.30)',
              color: '#fecaca',
              marginBottom: 12,
              whiteSpace: 'pre-wrap',
              backdropFilter: 'blur(10px)',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: 14,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.14)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
            backdropFilter: 'blur(12px)',
            marginBottom: 14,
          }}
        >
          {[5, 4, 3, 2, 1].map(s => {
            const n = dist[s as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = count ? Math.round((n / count) * 100) : 0;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: s === 5 ? 0 : 8 }}>
                <div style={{ width: 42, fontSize: 12, color: '#e2e8f0' }}>{s}★</div>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 999,
                    background: 'rgba(148,163,184,0.20)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background:
                        'linear-gradient(90deg, rgba(245,158,11,0.95) 0%, rgba(59,130,246,0.65) 100%)',
                    }}
                  />
                </div>
                <div style={{ width: 70, textAlign: 'right', fontSize: 12, color: '#cbd5e1' }}>
                  {n} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginBottom: 10,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: '#cbd5e1' }}>Filter by stars:</div>
          <select
            value={starFilter}
            onChange={e => {
              const v = e.target.value;
              setStarFilter(v === '' ? '' : Number(v));
            }}
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(2,6,23,0.45)',
              color: '#e5e7eb',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map(s => (
              <option key={s} value={s}>
                {s} star{s === 1 ? '' : 's'}
              </option>
            ))}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
            Showing {Math.min(filtered.length, 100)} of {rows.length}
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 18,
            overflow: 'hidden',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)',
            boxShadow:
              '0 22px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'rgba(2,6,23,0.35)' }}>
              <tr>
                {['Created', 'Stars', 'User', 'Session'].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      fontSize: 12,
                      color: '#e2e8f0',
                      borderBottom: '1px solid rgba(255,255,255,0.10)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 800 }}>
                    {r.stars}/5
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>{r.userId}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13 }}>
                    <code
                      style={{
                        fontSize: 12,
                        color: '#e2e8f0',
                        background: 'rgba(2,6,23,0.35)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '2px 6px',
                        borderRadius: 8,
                      }}
                    >
                      {r.sessionId}
                    </code>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12, color: '#cbd5e1', fontSize: 13 }}>
                    No ratings yet. Candidates will see the 5-star banner when they close the chat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

