import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatWidget } from './components/ChatWidget';

declare global {
  interface Window {
    initRecruitmentChatbot?: (config: {
      apiBaseUrl: string;
      authToken: string;
      userId: string;
      userRole: 'candidate' | 'hr';
      mountSelector?: string;
    }) => void;
  }
}

window.initRecruitmentChatbot = config => {
  const selector = config.mountSelector || '#recruitment-chat-container';
  const el = document.querySelector(selector);
  if (!el) {
    // eslint-disable-next-line no-console
    console.error(`Recruitment chatbot: mount element ${selector} not found`);
    return;
  }

  const root = createRoot(el);
  root.render(
    <ChatWidget
      apiBaseUrl={config.apiBaseUrl}
      authToken={config.authToken}
      userId={config.userId}
      userRole={config.userRole}
    />,
  );
};

