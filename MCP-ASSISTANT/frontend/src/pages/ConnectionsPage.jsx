import React, { useState, useEffect } from 'react';
import { GitBranch, MessageSquare, Layout } from 'lucide-react';

const ConnectionsPage = ({ userEmail }) => {
  const [integrations, setIntegrations] = useState(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'success') {
      alert("GitHub connected successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('slack') === 'success') {
      alert("Slack connected successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('jira') === 'success') {
      alert("Jira connected successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (userEmail) {
      fetch(`${VITE_BACKEND_URL}/integrations?user_email=${userEmail}`)
        .then(res => res.json())
        .then(data => setIntegrations(data))
        .catch(console.error);
    }
  }, [userEmail, VITE_BACKEND_URL]);

  const cards = [
    {
      id: "github",
      name: "GitHub",
      description: "View your PRs, issues and commits",
      icon: <GitBranch size={24} color="white" />,
      connected: integrations?.github,
      details: integrations?.github_username ? `@${integrations.github_username}` : null
    },
    {
      id: "slack",
      name: "Slack",
      description: "Read your workspace messages",
      icon: <MessageSquare size={24} color="white" />,
      connected: integrations?.slack,
      details: integrations?.slack_workspace
    },
    {
      id: "jira",
      name: "Jira",
      description: "Track your tickets and sprints",
      icon: <Layout size={24} color="white" />,
      connected: integrations?.jira,
      details: integrations?.jira_domain
    }
  ];

  const handleConnect = (service) => {
    if (!userEmail) {
      alert("Please log in first to connect services.");
      return;
    }
    window.location.href = `${VITE_BACKEND_URL}/auth/${service}?user_email=${userEmail}`;
  };

  return (
    <div style={{ padding: '32px', fontFamily: '"Space Grotesk", sans-serif', backgroundColor: 'transparent', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ color: 'white', fontSize: '32px', margin: '0 0 8px 0', fontWeight: 'bold' }}>Connections</h1>
      <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px 0' }}>Connect your tools to see your personal data</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px' }}>
        {cards.map(card => (
          <div key={card.id} style={{
            background: 'rgba(8,8,16,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {card.icon}
              </div>
              <div>
                <h3 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  {card.name} 
                  {card.details && <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px', fontWeight: 'normal' }}>({card.details})</span>}
                </h3>
                <p style={{ color: '#888', margin: '0', fontSize: '14px' }}>{card.description}</p>
              </div>
            </div>

            <div>
              {card.connected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88' }} />
                    <span style={{ color: '#00ff88', fontSize: '14px', fontWeight: 'bold' }}>Connected</span>
                  </div>
                  <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#555',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: 0
                  }}>Disconnect</button>
                </div>
              ) : (
                <button 
                  onClick={() => handleConnect(card.id)}
                  style={{
                    background: '#00d4ff',
                    color: 'black',
                    fontWeight: 'bold',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionsPage;
