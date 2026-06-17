import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Code, Shield, Heart } from 'lucide-react';

export default function About() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      // Reset form
      setFormData({ name: '', email: '', message: '' });
    }
  };

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

      <div className="glass-card default-padding">
        <h3 className="widget-title" style={{ border: 'none', padding: 0 }}>
          <Mail size={20} /> İletişim Formu
        </h3>
        {submitted ? (
          <div style={{ padding: 'var(--primary-spacing)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--secondary-spacing)' }}>
            <Heart size={36} color="var(--accent-color)" />
            <h4>Mesajınız İletildi!</h4>
            <p>Bana ulaştığınız için teşekkürler. En kısa sürede dönüş yapacağım.</p>
            <button className="button small-button" style={{ marginTop: '0.5rem' }} onClick={() => setSubmitted(false)}>
              Yeni Mesaj Gönder
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: 'var(--secondary-spacing)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label htmlFor="name" style={{ fontWeight: '600', fontSize: '0.95rem' }}>İsim</label>
              <input 
                id="name"
                type="text" 
                className="search-input" 
                placeholder="Adınız ve soyadınız" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label htmlFor="email" style={{ fontWeight: '600', fontSize: '0.95rem' }}>E-posta Adresi</label>
              <input 
                id="email"
                type="email" 
                className="search-input" 
                placeholder="ornek@alanadi.com" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label htmlFor="message" style={{ fontWeight: '600', fontSize: '0.95rem' }}>Mesaj</label>
              <textarea 
                id="message"
                className="search-input" 
                rows="4" 
                placeholder="Mesajınızı buraya yazın..." 
                required
                style={{ resize: 'vertical', minHeight: '6rem' }}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button type="submit" className="button" style={{ alignSelf: 'flex-start', marginTop: '0.3rem' }}>
              <Send size={16} />
              <span>Gönder</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
