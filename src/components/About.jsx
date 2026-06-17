import React from 'react';
import { Code } from 'lucide-react';

export default function About() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primary-spacing)', maxWidth: '55rem', margin: '0 auto', width: '100%' }}>
      
      <div className="glass-card default-padding">
        <h2>Hakkımda</h2>
        <p style={{ fontSize: '1.1rem', marginTop: 'var(--secondary-spacing)' }}>
          Merhaba! Ben **Anıl**. Oyun geliştirme, yapay zeka entegrasyonları ve web teknolojilerine ilgi duyan bağımsız bir geliştiriciyim. Unturned tarzı blok ve voxel tabanlı hayatta kalma oyunları geliştirmek, fizik motorları ile uğraşmak ve ağ kodlamaları (netcode) üzerine deneyler yapmak en büyük tutkum.
        </p>
        <p style={{ fontSize: '1.1rem', marginTop: 'var(--secondary-spacing)' }}>
          Bu blog üzerinden, geliştirdiğim projelerdeki teknik detayları, karşılaştığım zorlukları ve edindiğim tecrübeleri paylaşmayı hedefliyorum.
        </p>
      </div>

      <div className="glass-card default-padding">
        <h3 className="widget-title" style={{ border: 'none', padding: 0 }}>
          <Code size={20} /> Yetkinliklerim & Kullandığım Araçlar
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--secondary-spacing)', marginTop: 'var(--secondary-spacing)' }}>
          {['Unity Engine', 'C# / .NET', 'React.js', 'Vite', 'HTML5 & CSS3', 'Network Programming', 'Shader Coding', 'Blender (Voxel Art)'].map(skill => (
            <span 
              key={skill} 
              className="button small-button" 
              style={{ cursor: 'default', pointerEvents: 'none' }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
