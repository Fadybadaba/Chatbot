import React, { useEffect, useMemo, useState } from 'react';

type ApprovedCvRecord = {
  id: string;
  createdAt: string;
  jobTitle: string;
  candidateEmail: string | null;
  score: number | null;
  yearsDetected: number | null;
  fileName: string;
  fileSizeKb: number;
  sessionId: string;
  uploadedByUserId: string;
  extractedTextPreview: string;
};

type ChatRating = {
  id: string;
  sessionId: string;
  userId: string;
  stars: number;
  createdAt: string;
};

const JOB_FILTER_OPTIONS = [
  '',
  'Senior Full-Stack Developer',
  'Talent Acquisition Lead (HR)',
  'Senior Financial Analyst',
] as const;

export const HrDashboard: React.FC<{
  apiBaseUrl: string;
  authToken: string;
  userId: string;
  hrDashboardPassword: string;
  onLock: () => void;
}> = ({ apiBaseUrl, authToken, userId, hrDashboardPassword, onLock }) => {
  const [rows, setRows] = useState<ApprovedCvRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cvApprovedCount, setCvApprovedCount] = useState<number>(0);
  const [cvRejectedCount, setCvRejectedCount] = useState<number>(0);
  const [ratingsAvg, setRatingsAvg] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState<number>(0);
  const [ratingsDist, setRatingsDist] = useState<Record<number, number>>({});
  const [ratingsRows, setRatingsRows] = useState<ChatRating[]>([]);
  const [ratingsStarFilter, setRatingsStarFilter] = useState<number | ''>('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterJob, setFilterJob] = useState<string>('');

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (filterJob && r.jobTitle !== filterJob) return false;
      const q = filterSearch.trim().toLowerCase();
      if (!q) return true;
      const hay = [
        r.jobTitle,
        r.candidateEmail || '',
        r.fileName,
        r.sessionId,
        r.uploadedByUserId,
        r.extractedTextPreview,
        String(r.score ?? ''),
        String(r.yearsDetected ?? ''),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filterSearch, filterJob]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const cvSummaryRes = await fetch(`${apiBaseUrl}/api/hr/cv-decisions/summary`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
          'x-user-role': 'hr',
          'x-hr-dashboard-password': hrDashboardPassword,
        },
      });
      if (cvSummaryRes.ok) {
        const s = (await cvSummaryRes.json()) as {
          total: number;
          approved: number;
          rejected: number;
        };
        setCvApprovedCount(s.approved || 0);
        setCvRejectedCount(s.rejected || 0);
      }

      const ratingsRes = await fetch(`${apiBaseUrl}/api/hr/chat-ratings/summary`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
          'x-user-role': 'hr',
          'x-hr-dashboard-password': hrDashboardPassword,
        },
      });
      if (ratingsRes.ok) {
        const s = (await ratingsRes.json()) as {
          count: number;
          average: number | null;
          distribution?: Record<1 | 2 | 3 | 4 | 5, number>;
        };
        setRatingsAvg(s.average);
        setRatingsCount(s.count);
        setRatingsDist(s.distribution || {});
      }

      const ratingsListRes = await fetch(`${apiBaseUrl}/api/hr/chat-ratings`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
          'x-user-role': 'hr',
          'x-hr-dashboard-password': hrDashboardPassword,
        },
      });
      if (ratingsListRes.ok) {
        setRatingsRows((await ratingsListRes.json()) as ChatRating[]);
      }

      const res = await fetch(`${apiBaseUrl}/api/hr/approved-cvs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
          'x-user-role': 'hr',
          'x-hr-dashboard-password': hrDashboardPassword,
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Password invalid/expired: lock the dashboard and bounce user out.
          setError('Wrong password');
          onLock();
          return;
        }
        throw new Error(await res.text());
      }
      setRows((await res.json()) as ApprovedCvRecord[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load approved CVs');
    } finally {
      setLoading(false);
    }
  };

  const downloadRatings = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/hr/chat-ratings/export`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
          'x-user-role': 'hr',
          'x-hr-dashboard-password': hrDashboardPassword,
        },
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
      setError(
        e instanceof Error ? `Failed to download ratings: ${e.message}` : 'Failed to download ratings',
      );
    }
  };

  const openPdf = async (id: string, fileName: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/hr/approved-cvs/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'x-user-id': userId,
          'x-user-role': 'hr',
          'x-hr-dashboard-password': hrDashboardPassword,
        },
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
      window.open(url, '_blank', 'noopener,noreferrer');
      // Best-effort cleanup later
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Failed to open PDF (${fileName}): ${e.message}`
          : `Failed to open PDF (${fileName})`,
      );
    }
  };

  const downloadPdf = async (id: string, fileName: string) => {
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/hr/approved-cvs/${id}/pdf?download=1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'x-user-id': userId,
            'x-user-role': 'hr',
            'x-hr-dashboard-password': hrDashboardPassword,
          },
        },
      );
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
      a.download = fileName || 'cv.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Failed to download PDF (${fileName}): ${e.message}`
          : `Failed to download PDF (${fileName})`,
      );
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: '#f59e0b',
                boxShadow: '0 0 0 4px rgba(245,158,11,0.18)',
              }}
            />
            <h2 style={{ margin: 0, letterSpacing: -0.6 }}>HR Dashboard</h2>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 6 }}>
            Approved CVs (secure demo list).
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
            CV decisions: {cvApprovedCount} approved / {cvRejectedCount} rejected
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>
            Chat rating average: {ratingsAvg === null ? '—' : `${ratingsAvg}/5`} ({ratingsCount} ratings)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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
            Save ratings
          </button>
          <button
            type="button"
            onClick={onLock}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(2,6,23,0.35)',
              color: '#e5e7eb',
              cursor: 'pointer',
              fontSize: 12,
              boxShadow: '0 12px 26px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(10px)',
            }}
          >
            Lock
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
            ← Back to chat
          </a>
          <button
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
          marginBottom: 14,
          padding: 14,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.14)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ fontWeight: 800, letterSpacing: -0.2 }}>Chatbot Ratings</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>Filter:</div>
            <select
              value={ratingsStarFilter}
              onChange={e => {
                const v = e.target.value;
                setRatingsStarFilter(v === '' ? '' : Number(v));
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
              <option value="">All stars</option>
              {[5, 4, 3, 2, 1].map(s => (
                <option key={s} value={s}>
                  {s} star{s === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
          {[5, 4, 3, 2, 1].map(s => {
            const n = ratingsDist?.[s] || 0;
            const pct = ratingsCount ? Math.round((n / ratingsCount) * 100) : 0;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            marginTop: 12,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.10)',
            overflow: 'hidden',
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
              {ratingsRows
                .filter(r => (ratingsStarFilter === '' ? true : r.stars === ratingsStarFilter))
                .slice(0, 50)
                .map(r => (
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
              {ratingsRows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12, color: '#cbd5e1', fontSize: 13 }}>
                    No ratings yet. Users will see the 5-star banner when they close the chat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          Showing up to the latest 50 ratings. Use “Save ratings” to export all.
        </div>
      </div>

      <div
        style={{
          marginBottom: 14,
          padding: 14,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.14)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: '#94a3b8',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Search
          </label>
          <input
            type="search"
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder="Email, file name, job, session, CV text…"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(2,6,23,0.45)',
              color: '#e5e7eb',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: '0 1 260px' }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: '#94a3b8',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            Job role
          </label>
          <select
            value={filterJob}
            onChange={e => setFilterJob(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(2,6,23,0.45)',
              color: '#e5e7eb',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="">All roles</option>
            {JOB_FILTER_OPTIONS.filter(Boolean).map(j => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#cbd5e1',
            paddingBottom: 10,
            whiteSpace: 'nowrap',
          }}
        >
          Showing {filteredRows.length} of {rows.length}
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
              {[
                'Created',
                'Job',
                'Candidate email',
                'Score',
                'Years',
                'File',
                'CV PDF',
                'Session',
              ].map(h => (
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
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 14,
                    color: '#cbd5e1',
                    fontSize: 13,
                  }}
                >
                  No approved CVs yet. Approve a CV in chat, then click Refresh.
                </td>
              </tr>
            )}
            {rows.length > 0 && filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 14,
                    color: '#cbd5e1',
                    fontSize: 13,
                  }}
                >
                  No CVs match your filters. Clear search or set job to &quot;All roles&quot;.
                </td>
              </tr>
            )}
            {filteredRows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{r.jobTitle}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  {r.candidateEmail || '—'}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  {r.score ?? '—'}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  {r.yearsDetected ?? '—'}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  {r.fileName} ({r.fileSizeKb} KB)
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openPdf(r.id, r.fileName)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: 'rgba(2,6,23,0.30)',
                        color: '#e5e7eb',
                        cursor: 'pointer',
                        fontSize: 12,
                        boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => downloadPdf(r.id, r.fileName)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid rgba(245,158,11,0.35)',
                        background:
                          'linear-gradient(180deg, rgba(245,158,11,0.95) 0%, rgba(217,119,6,0.95) 100%)',
                        color: '#111827',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: 12,
                        boxShadow: '0 14px 30px rgba(245,158,11,0.18)',
                      }}
                    >
                      Download
                    </button>
                  </div>
                </td>
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
          </tbody>
        </table>
      </div>

      </div>
    </div>
  );
};

