import React, { useState, useEffect } from 'react';
import { Gamepad2, Sun, Moon, Home, HelpCircle, PenLine } from 'lucide-react';

const GithubIcon = ({ size = 16 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Header({ currentTab, setCurrentTab, resetFilters }) {
  const [theme, setTheme] = useState(() => {
    // Check local storage or document root
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    resetFilters();
    setCurrentTab('home');
  };

  return (
    <header className="site-header glass-card">
      <div className="header-top">
        <a href="#" className="logo-container" onClick={handleHomeClick}>
          <div className="logo-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent-color)' }}>
            <Gamepad2 size={28} color="#fff" />
          </div>
          <h1 className="site-title">Rotstead Devblog</h1>
        </a>
        
        <button className="button small-button" onClick={toggleTheme} aria-label="Temayı Değiştir">
          {theme === 'dark' ? (
            <>
              <Sun size={16} />
              <span>Gündüz Modu</span>
            </>
          ) : (
            <>
              <Moon size={16} />
              <span>Gece Modu</span>
            </>
          )}
        </button>
      </div>

      <nav>
        <ul>
          <li>
            <a href="#" className={`button small-button ${currentTab === 'home' ? 'active' : ''}`} onClick={handleHomeClick}>
              <Home size={16} />
              <span>Ana Sayfa</span>
            </a>
          </li>
          <li>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="button small-button">
              <GithubIcon size={16} />
              <span>GitHub</span>
            </a>
          </li>
          <li>
            <a href="#" className={`button small-button ${currentTab === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentTab('about'); }}>
              <HelpCircle size={16} />
              <span>Hakkımda & İletişim</span>
            </a>
          </li>
          <li>
            <a href="#" className={`button small-button ${currentTab === 'editor' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentTab('editor'); }}>
              <PenLine size={16} />
              <span>Yazı Ekle</span>
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
