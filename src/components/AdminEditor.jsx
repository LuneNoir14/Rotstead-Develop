import React, { useState, useEffect } from 'react';
import { PenTool, Eye, FileText, Check, Copy } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

// Custom Markdown parser wrapper just for previewing
function previewMarkdown(content) {
  if (!content) return <p style={{ fontStyle: 'italic', color: 'var(--detail-color)' }}>İçerik henüz boş...</p>;
  
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeLang = '';
  
  let inTable = false;
  let tableRows = [];
  
  let inList = false;
  let listItems = [];
  let listType = ''; // 'ul' or 'ol'
  
  const flushList = (key) => {
    if (listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(<ul key={`ul-${key}`}>{listItems.map((item, idx) => <li key={idx}>{item}</li>)}</ul>);
      } else {
        elements.push(<ol key={`ol-${key}`}>{listItems.map((item, idx) => <li key={idx}>{item}</li>)}</ol>);
      }
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      const hasHeader = tableRows.length > 1 && tableRows[1].some(cell => cell.startsWith(':--') || cell.startsWith('--') || cell.endsWith('--:'));
      let headers = [];
      let bodyRows = [];
      if (hasHeader) {
        headers = tableRows[0];
        bodyRows = tableRows.slice(2);
      } else {
        bodyRows = tableRows;
      }
      elements.push(
        <table key={`table-${key}`}>
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((header, idx) => <th key={idx}>{header}</th>)}
              </tr>
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => <td key={cellIdx}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="glass-card">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().slice(3);
        flushList(i);
        flushTable(i);
      }
      continue;
    }
    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }
    
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList(i);
      inTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }
    
    const isUnorderedList = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const isOrderedList = /^\d+\.\s/.test(line.trim());
    
    if (isUnorderedList || isOrderedList) {
      flushTable(i);
      const currentListType = isUnorderedList ? 'ul' : 'ol';
      if (inList && listType !== currentListType) flushList(i);
      inList = true;
      listType = currentListType;
      const itemText = isUnorderedList ? line.trim().replace(/^[-*]\s+/, '') : line.trim().replace(/^\d+\.\s+/, '');
      listItems.push(parseInlineMarkdown(itemText));
      continue;
    } else if (inList) {
      flushList(i);
    }
    
    const trimmed = line.trim();
    if (trimmed === '') continue;
    
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i}>{parseInlineMarkdown(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i}>{parseInlineMarkdown(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i}>{parseInlineMarkdown(trimmed.slice(2))}</h1>);
    } else if (trimmed.startsWith('> ')) {
      elements.push(<blockquote key={i}>{parseInlineMarkdown(trimmed.slice(2))}</blockquote>);
    } else {
      elements.push(<p key={i}>{parseInlineMarkdown(trimmed)}</p>);
    }
  }
  flushList(lines.length);
  flushTable(lines.length);
  return elements;
}

function parseInlineMarkdown(text) {
  if (!text) return '';
  const tokens = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
  let match;
  let lastIdx = 0;
  const matches = [];
  while ((match = regex.exec(text)) !== null) {
    matches.push({ text: match[0], index: match.index });
  }
  if (matches.length === 0) return text;
  let currentKey = 0;
  matches.forEach(m => {
    if (m.index > lastIdx) tokens.push(text.slice(lastIdx, m.index));
    const tokenText = m.text;
    if (tokenText.startsWith('**') && tokenText.endsWith('**')) {
      tokens.push(<strong key={currentKey++}>{tokenText.slice(2, -2)}</strong>);
    } else if (tokenText.startsWith('`') && tokenText.endsWith('`')) {
      tokens.push(<code key={currentKey++}>{tokenText.slice(1, -1)}</code>);
    } else if (tokenText.startsWith('[') && tokenText.includes('](')) {
      const closeBracket = tokenText.indexOf(']');
      const linkLabel = tokenText.slice(1, closeBracket);
      const linkUrl = tokenText.slice(closeBracket + 2, -1);
      tokens.push(
        <a key={currentKey++} href={linkUrl} target="_blank" rel="noopener noreferrer">
          {linkLabel}
        </a>
      );
    }
    lastIdx = m.index + tokenText.length;
  });
  if (lastIdx < text.length) tokens.push(text.slice(lastIdx));
  return tokens;
}

export default function AdminEditor({ onBack }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Geliştirme Günlükleri');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  
  const [copiedRegistry, setCopiedRegistry] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Auto generate slug
  const getSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  };

  const slug = getSlug(title) || 'yeni-makale';
  
  // Calculate read time
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));
  const readTimeStr = `${readTimeMin} dk`;
  
  const todayDate = new Date().toISOString().split('T')[0];

  // Generated JSON entry for registry.json
  const generatedJson = JSON.stringify({
    id: slug,
    title: title || 'Başlıksız Makale',
    category: category,
    date: todayDate,
    readTime: readTimeStr,
    image: image,
    excerpt: excerpt || 'Açıklama girilmedi.',
    file: `${slug}.md`
  }, null, 2);

  // Generated markdown content for the post file
  const generatedMarkdown = content;

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primary-spacing)', maxWidth: '65rem', margin: '0 auto', width: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="button small-button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Geri Dön</span>
        </button>
        <div style={{ display: 'flex', gap: 'var(--secondary-spacing)' }}>
          <button className={`button small-button ${!isPreview ? 'active' : ''}`} onClick={() => setIsPreview(false)}>
            <PenTool size={14} />
            <span>Yaz</span>
          </button>
          <button className={`button small-button ${isPreview ? 'active' : ''}`} onClick={() => setIsPreview(true)}>
            <Eye size={14} />
            <span>Önizleme</span>
          </button>
        </div>
      </div>

      {!isPreview ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primary-spacing)' }}>
          {/* Metadata Fields */}
          <div className="glass-card default-padding">
            <h2>Yeni Makale Detayları</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '0.8rem', marginTop: 'var(--secondary-spacing)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label htmlFor="post-title" style={{ fontWeight: '600', fontSize: '0.95rem' }}>Başlık</label>
                <input 
                  id="post-title"
                  type="text" 
                  className="search-input" 
                  placeholder="örn: Araç Sürüş Mekanikleri Güncellemesi" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label htmlFor="post-category" style={{ fontWeight: '600', fontSize: '0.95rem' }}>Kategori</label>
                <select 
                  id="post-category"
                  className="search-input" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ backgroundColor: 'var(--background-color)', height: '2.5rem' }}
                >
                  <option value="Geliştirme Günlükleri">Geliştirme Günlükleri</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 2' }}>
                <label htmlFor="post-image" style={{ fontWeight: '600', fontSize: '0.95rem' }}>Görsel URL</label>
                <input 
                  id="post-image"
                  type="text" 
                  className="search-input" 
                  placeholder="https://images.unsplash.com/..." 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 2' }}>
                <label htmlFor="post-excerpt" style={{ fontWeight: '600', fontSize: '0.95rem' }}>Kısa Özet (Ana Sayfa Önizlemesi)</label>
                <input 
                  id="post-excerpt"
                  type="text" 
                  className="search-input" 
                  placeholder="Makalenin ana sayfa kartında görünecek kısa bir özeti." 
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Markdown Content Area */}
          <div className="glass-card default-padding">
            <h2>İçerik (Markdown)</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--detail-color)', marginBottom: '0.5rem' }}>
              İçerikte normal yazıların yanı sıra başlıklar için <code>## Başlık 2</code> veya <code>### Başlık 3</code>, listeler için <code>- Öge</code>, alıntılar için <code>&gt; Alıntı</code>, kalın metinler için <code>**kalın**</code> ve kod blokları için üçlü backtick <code>```csharp</code> kullanabilirsiniz.
            </p>
            <textarea 
              className="search-input" 
              rows="12" 
              placeholder="Oyun geliştirme günlüğünüzü buraya yazın..." 
              style={{ resize: 'vertical', minHeight: '15rem', fontFamily: 'monospace' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Code Generation Output */}
          <div className="glass-card default-padding">
            <h2>Yayına Alma Kodu Üretici</h2>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Makaleniz hazır olduğunda, aşağıdaki iki adım ile projenizin yayınına ekleyebilirsiniz:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <strong>Adım 1: Bu JSON kodunu <code>public/posts/registry.json</code> dosyasının en üstüne (köşeli parantezin içine) ekleyin:</strong>
                  <button className="button small-button" onClick={() => copyToClipboard(generatedJson, setCopiedRegistry)}>
                    {copiedRegistry ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedRegistry ? 'Kopyalandı!' : 'Kopyala'}</span>
                  </button>
                </div>
                <pre style={{ backgroundColor: 'var(--secondary-detail-color)', padding: '0.8rem', borderRadius: '0.5rem', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid var(--primary-color)' }}>
                  <code>{generatedJson}</code>
                </pre>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <strong>Adım 2: <code>public/posts/{slug}.md</code> adında yeni bir dosya oluşturup aşağıdaki içeriği içine yapıştırın:</strong>
                  <button className="button small-button" onClick={() => copyToClipboard(generatedMarkdown, setCopiedMarkdown)}>
                    {copiedMarkdown ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedMarkdown ? 'Kopyalandı!' : 'Kopyala'}</span>
                  </button>
                </div>
                <pre style={{ backgroundColor: 'var(--secondary-detail-color)', padding: '0.8rem', borderRadius: '0.5rem', overflowX: 'auto', fontSize: '0.85rem', maxHeight: '15rem', overflowY: 'auto', border: '1px solid var(--primary-color)' }}>
                  <code>{generatedMarkdown || '# Henüz içerik girilmedi'}</code>
                </pre>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* Blog Post Live Style Preview */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primary-spacing)' }}>
          <div className="glass-card" style={{ padding: '0.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--accent-color)', color: 'white', fontWeight: 'bold', borderRadius: 'var(--border-radius)' }}>
            Canlı Önizleme Modu (Ziyaretçileriniz makaleyi bu şekilde görecek)
          </div>
          
          <article className="article-blog-post">
            <div className="post-header">
              <h1 className="post-title">{title || 'Makale Başlığı'}</h1>
              <div className="detail-text meta-row">
                <span>{new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>•</span>
                <span>{readTimeStr} okuma süresi</span>
                <span>•</span>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{category}</span>
              </div>
            </div>

            {image && (
              <img 
                className="post-banner-img" 
                src={image} 
                alt={title || 'Banner'} 
                onError={(e) => { e.target.style.display = 'none'; }} 
              />
            )}

            <div className="post-content">
              {previewMarkdown(content)}
            </div>
          </article>
        </div>
      )}

    </div>
  );
}
