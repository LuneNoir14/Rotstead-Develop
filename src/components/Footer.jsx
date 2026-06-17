import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <small>
        Telif Hakkı © {currentYear} Rotstead Devblog. Tüm Hakları Saklıdır.
      </small>
      <small>
        Türkiye'de <span className="flag-emoji" style={{ fontSize: '1.2rem', verticalAlign: 'middle', margin: '0 0.2rem' }}>🇹🇷</span> React + Vite kullanılarak sevgiyle geliştirildi.
      </small>
    </footer>
  );
}
