import React, { useEffect, useRef, useState } from 'react';
import { ChatProvider, useChat } from './ChatContext';

const JOB_BUTTONS_RE = /\[JOB_BUTTONS:([^\]]+)\]/;

function parseJobButtons(text: string): { cleanedText: string; buttons: string[] } {
  const match = text.match(JOB_BUTTONS_RE);
  if (!match) return { cleanedText: text, buttons: [] };

  const buttons = match[1]
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  const cleanedText = text.replace(JOB_BUTTONS_RE, '').trim();
  return { cleanedText, buttons };
}

interface ChatWidgetProps {
  apiBaseUrl: string;
  authToken: string;
  userId: string;
  userRole: 'candidate' | 'hr';
}

// Allow rating every time user closes the chat (collect multiple samples).

function Star({
  filled,
  onClick,
  disabled,
}: {
  filled: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={filled ? 'Filled star' : 'Empty star'}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 22,
        lineHeight: 1,
        color: filled ? '#f59e0b' : 'rgba(148,163,184,0.65)',
        textShadow: filled ? '0 10px 22px rgba(245,158,11,0.18)' : 'none',
      }}
    >
      ★
    </button>
  );
}

const ChatWindow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { messages, loading, sendMessage, uploadCv } = useChat();
  const [text, setText] = useState('');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to latest message whenever messages change.
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleCvPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!selectedJob) {
      await sendMessage('Please select a job first, then upload your CV.');
      return;
    }
    await uploadCv(file, selectedJob);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    if (
      trimmed === 'Senior Full-Stack Developer' ||
      trimmed === 'Talent Acquisition Lead (HR)' ||
      trimmed === 'Senior Financial Analyst'
    ) {
      setSelectedJob(trimmed);
    }
    await sendMessage(trimmed);
    setText('');
  };

  return (
    <div
      style={{
        width: 320,
        height: 420,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#1f2933',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 14,
        }}
      >
        <span>Recruitment Assistant</span>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          flex: 1,
          padding: 8,
          overflowY: 'auto',
          backgroundColor: '#f5f7fa',
        }}
      >
        {messages.map(m => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 6,
            }}
          >
            {(() => {
              const parsed = m.sender === 'bot' ? parseJobButtons(m.text) : { cleanedText: m.text, buttons: [] as string[] };
              return (
                <>
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '6px 10px',
                      borderRadius: 12,
                      fontSize: 13,
                      backgroundColor:
                        m.sender === 'user' ? '#2563eb' : '#e5e7eb',
                      color: m.sender === 'user' ? '#ffffff' : '#111827',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {parsed.cleanedText}
                  </div>

                  {parsed.buttons.length > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {parsed.buttons.map(btn => (
                        <button
                          key={btn}
                          type="button"
                          disabled={loading}
                          onClick={() => {
                            setSelectedJob(btn);
                            void sendMessage(btn);
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 999,
                            border: '1px solid #d1d5db',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            fontSize: 12,
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                          }}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ))}
        {messages.length === 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '6px 10px',
                borderRadius: 12,
                fontSize: 13,
                backgroundColor: '#e5e7eb',
                color: '#111827',
                whiteSpace: 'pre-wrap',
              }}
            >
              hi how can i help you ?
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div
        style={{
          padding: 8,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={handleCvPick}
        />
        <button
          type="button"
          disabled={loading || !selectedJob}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #2563eb',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'wait' : selectedJob ? 'pointer' : 'not-allowed',
            opacity: loading || !selectedJob ? 0.65 : 1,
          }}
        >
          Upload CV (PDF)
        </button>
        {!selectedJob && (
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            Select a job first to enable CV upload.
          </div>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="text"
          value={text}
          disabled={loading}
          placeholder="Type a message..."
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            flex: 1,
            fontSize: 13,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            fontSize: 13,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Send
        </button>
        </div>
      </div>
    </div>
  );
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiBaseUrl,
  authToken,
  userId,
  userRole,
}) => {
  return (
    <ChatProvider
      apiBaseUrl={apiBaseUrl}
      authToken={authToken}
      userId={userId}
      userRole={userRole}
    >
      <ChatWidgetInner />
    </ChatProvider>
  );
};

const ChatWidgetInner: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { submitRating, getSessionId, messages } = useChat();

  const closeChat = () => {
    setOpen(false);
    const sid = getSessionId();
    if (sid && messages.length > 0) {
      setShowRating(true);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 9999,
      }}
    >
      {open && (
        <div style={{ marginBottom: 8 }}>
          <ChatWindow onClose={closeChat} />
        </div>
      )}

      {showRating && (
        <div
          style={{
            width: 320,
            marginBottom: 8,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.16)',
            background:
              'linear-gradient(180deg, rgba(2,6,23,0.72) 0%, rgba(2,6,23,0.55) 100%)',
            boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            color: '#e5e7eb',
            padding: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>
              Rate the chatbot quality
            </div>
            <button
              type="button"
              onClick={() => setShowRating(false)}
              disabled={submitting}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#e5e7eb',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const n = i + 1;
              const filled = (hoverStars ?? 0) >= n;
              return (
                <span
                  key={n}
                  onMouseEnter={() => setHoverStars(n)}
                  onMouseLeave={() => setHoverStars(null)}
                >
                  <Star
                    filled={filled}
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      await submitRating(n);
                      setSubmitting(false);
                      setShowRating(false);
                      setShowThanks(true);
                      setTimeout(() => setShowThanks(false), 2500);
                    }}
                  />
                </span>
              );
            })}
            <div style={{ marginLeft: 8, fontSize: 12, color: '#cbd5e1' }}>
              {hoverStars ? `${hoverStars}/5` : ' '}
            </div>
          </div>
        </div>
      )}

      {showThanks && (
        <div
          style={{
            width: 320,
            marginBottom: 8,
            borderRadius: 14,
            border: '1px solid rgba(245,158,11,0.26)',
            background:
              'linear-gradient(180deg, rgba(245,158,11,0.20) 0%, rgba(2,6,23,0.55) 100%)',
            boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            color: '#e5e7eb',
            padding: 12,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Thank you for your rating!
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.18)',
          background:
            'radial-gradient(16px 16px at 30% 25%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.00) 60%), ' +
            'linear-gradient(180deg, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.95) 100%)',
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.2,
          cursor: 'pointer',
          boxShadow:
            '0 18px 45px rgba(0,0,0,0.45), 0 10px 22px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.14)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 9999,
            background:
              'radial-gradient(40px 18px at 50% 0%, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.00) 70%)',
            pointerEvents: 'none',
          }}
        />
        <span style={{ position: 'relative' }}>{open ? 'Close' : 'Chat'}</span>
      </button>
    </div>
  );
};

