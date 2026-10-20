'use client';

import { useEffect } from 'react';

export default function MembershipRedirect() {
  useEffect(() => {
    window.location.replace('/#membership');
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F9F6ED' }}>
      <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '12px' }}>Loading Pavilion Club Membership...</p>
    </div>
  );
}
