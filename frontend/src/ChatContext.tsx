import React, { createContext, useContext, useState } from 'react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  createdAt: string;
}

interface ChatContextValue {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (text: string) => Promise<void>;
  uploadCv: (file: File, jobTitle: string) => Promise<void>;
  submitRating: (stars: number) => Promise<void>;
  getSessionId: () => string | undefined;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  apiBaseUrl: string;
  authToken: string;
  userId: string;
  userRole: 'candidate' | 'hr';
  children: React.ReactNode;
}

async function postChatMessage(params: {
  apiBaseUrl: string;
  authToken: string;
  userId: string;
  userRole: 'candidate' | 'hr';
  sessionId?: string;
  content: string;
}) {
  const res = await fetch(`${params.apiBaseUrl}/api/chat/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.authToken}`,
      'x-user-id': params.userId,
      'x-user-role': params.userRole,
    },
    body: JSON.stringify({
      sessionId: params.sessionId,
      content: params.content,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to send chat message');
  }

  return res.json() as Promise<{ sessionId: string; text: string }>;
}

async function postChatCv(params: {
  apiBaseUrl: string;
  authToken: string;
  userId: string;
  userRole: 'candidate' | 'hr';
  sessionId?: string;
  file: File;
  jobTitle: string;
}) {
  const form = new FormData();
  form.append('cv', params.file);
  form.append('jobTitle', params.jobTitle);
  if (params.sessionId) {
    form.append('sessionId', params.sessionId);
  }

  const res = await fetch(`${params.apiBaseUrl}/api/chat/cv`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.authToken}`,
      'x-user-id': params.userId,
      'x-user-role': params.userRole,
    },
    body: form,
  });

  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    const errBody = await res.text();
    // If we got an HTML error page, show a clean message.
    if (ct.includes('text/html')) {
      throw new Error('Server error while screening the CV. Check backend logs.');
    }
    throw new Error(errBody || 'Failed to upload CV');
  }

  return res.json() as Promise<{ sessionId: string; text: string }>;
}

async function postChatRating(params: {
  apiBaseUrl: string;
  authToken: string;
  userId: string;
  userRole: 'candidate' | 'hr';
  sessionId: string;
  stars: number;
}) {
  const res = await fetch(`${params.apiBaseUrl}/api/chat/rating`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.authToken}`,
      'x-user-id': params.userId,
      'x-user-role': params.userRole,
    },
    body: JSON.stringify({
      sessionId: params.sessionId,
      stars: params.stars,
    }),
  });

  if (!res.ok) {
    // Rating should never break UX.
    throw new Error(await res.text());
  }
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  apiBaseUrl,
  authToken,
  userId,
  userRole,
  children,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const userMsg: ChatMessage = {
        id: `${Date.now()}-user`,
        sender: 'user',
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);

      const res = await postChatMessage({
        apiBaseUrl,
        authToken,
        userId,
        userRole,
        sessionId,
        content: trimmed,
      });

      if (res.sessionId && res.sessionId !== sessionId) {
        setSessionId(res.sessionId);
      }

      const botMsg: ChatMessage = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: res.text,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const uploadCv = async (file: File, jobTitle: string) => {
    setLoading(true);
    try {
      const userMsg: ChatMessage = {
        id: `${Date.now()}-user`,
        sender: 'user',
        text: `📎 CV: ${file.name}`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);

      const res = await postChatCv({
        apiBaseUrl,
        authToken,
        userId,
        userRole,
        sessionId,
        file,
        jobTitle,
      });

      if (res.sessionId && res.sessionId !== sessionId) {
        setSessionId(res.sessionId);
      }

      const botMsg: ChatMessage = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: res.text,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const botMsg: ChatMessage = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text:
          e instanceof Error
            ? `Could not upload your CV: ${e.message}`
            : 'Could not upload your CV. Try a PDF under 5 MB.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (stars: number) => {
    const sid = sessionId;
    if (!sid) return;
    try {
      await postChatRating({
        apiBaseUrl,
        authToken,
        userId,
        userRole,
        sessionId: sid,
        stars,
      });
    } catch {
      // ignore
    }
  };

  const getSessionId = () => sessionId;

  return (
    <ChatContext.Provider
      value={{ messages, loading, sendMessage, uploadCv, submitRating, getSessionId }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextValue => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return ctx;
};

