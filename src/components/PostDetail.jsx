import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Tag, PenLine, Trash2 } from 'lucide-react';

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// A lightweight custom Markdown parser that outputs React elements
function parseMarkdown(content) {
  if (!content) return null;
  
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
    
    // Code block detection
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="glass-card">
            <code className={codeLang ? `language-${codeLang}` : ''}>
              {codeBlockLines.join('\n')}
            </code>
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
    
    // Table parsing
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList(i);
      inTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }
    
    // Ordered/Unordered list detection
    const isUnorderedList = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const isOrderedList = /^\d+\.\s/.test(line.trim());
    
    if (isUnorderedList || isOrderedList) {
      flushTable(i);
      const currentListType = isUnorderedList ? 'ul' : 'ol';
      
      if (inList && listType !== currentListType) {
        flushList(i);
      }
      
      inList = true;
      listType = currentListType;
      
      const itemText = isUnorderedList 
        ? line.trim().replace(/^[-*]\s+/, '') 
        : line.trim().replace(/^\d+\.\s+/, '');
      
      listItems.push(parseInlineMarkdown(itemText));
      continue;
    } else if (inList) {
      flushList(i);
    }
    
    // Plain line processing (headers, blockquotes, paragraphs)
    const trimmed = line.trim();
    if (trimmed === '') {
      continue;
    }
    
    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i}>{parseInlineMarkdown(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i}>{parseInlineMarkdown(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i}>{parseInlineMarkdown(trimmed.slice(2))}</h1>);
    } 
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      elements.push(<blockquote key={i}>{parseInlineMarkdown(trimmed.slice(2))}</blockquote>);
    } 
    // Image Gallery Row (2 or more images side-by-side)
    else if (/^(!\[.*?\]\(.*?\)\s*){2,}$/.test(trimmed)) {
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
      let imgMatch;
      const imagesInRow = [];
      let imgIdx = 0;
      while ((imgMatch = imgRegex.exec(trimmed)) !== null) {
        const alt = imgMatch[1];
        const url = imgMatch[2];
        const hasCaption = alt && alt.trim() && !/^img_\d+$/i.test(alt) && alt !== 'Görsel' && alt !== 'image';
        imagesInRow.push(
          <figure key={imgIdx++} className="post-gallery-figure">
            <img src={url} alt={alt} />
            {hasCaption && (
              <figcaption className="post-gallery-caption">{alt}</figcaption>
            )}
          </figure>
        );
      }
      elements.push(
        <div key={i} className="post-image-gallery-row">
          {imagesInRow}
        </div>
      );
    }
    // Paragraph
    else {
      elements.push(<p key={i}>{parseInlineMarkdown(trimmed)}</p>);
    }
  }
  
  // Flush anything remaining at end of file
  flushList(lines.length);
  flushTable(lines.length);
  
  return elements;
}// Inline parser for **bold**, `code`, [links](url) and ![images](url)
function parseInlineMarkdown(text) {
  if (!text) return '';
  
  const tokens = [];
  const regex = /(\*\*.*?\*\*|`.*?`|!\[.*?\]\(.*?\)|\[.*?\]\(.*?\))/g;
  let match;
  let lastIdx = 0;
  
  const matches = [];
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      text: match[0],
      index: match.index,
    });
  }
  
  if (matches.length === 0) {
    return text;
  }
  
  for (const m of matches) {
    if (m.index > lastIdx) {
      tokens.push(text.slice(lastIdx, m.index));
    }
    
    if (m.text.startsWith('**')) {
      tokens.push(<strong key={m.index}>{m.text.slice(2, -2)}</strong>);
    } else if (m.text.startsWith('`')) {
      tokens.push(<code key={m.index}>{m.text.slice(1, -1)}</code>);
    } else if (m.text.startsWith('![')) {
      const alt = m.text.slice(2, m.text.indexOf(']'));
      const url = m.text.slice(m.text.indexOf('(') + 1, -1);
      const hasCaption = alt && alt.trim() && !/^img_\d+$/i.test(alt) && alt !== 'Görsel' && alt !== 'image' && alt !== 'video';
      
      const getYouTubeEmbedUrl = (link) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = link.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
      };

      const youtubeEmbedUrl = getYouTubeEmbedUrl(url);
      const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
      const isDirectVideo = url.startsWith('data:video/') || cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || alt.toLowerCase() === 'video';

      if (youtubeEmbedUrl) {
        tokens.push(
          <figure key={m.index} className="post-inline-figure" style={{ width: '100%', maxWidth: '650px' }}>
            <div className="post-video-frame">
              <iframe
                src={youtubeEmbedUrl}
                title={alt || "YouTube Video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {hasCaption && (
              <figcaption className="post-inline-caption">{alt}</figcaption>
            )}
          </figure>
        );
      } else if (isDirectVideo) {
        tokens.push(
          <figure key={m.index} className="post-inline-figure">
            <video 
              src={url} 
              controls 
              preload="metadata" 
            />
            {hasCaption && (
              <figcaption className="post-inline-caption">{alt !== 'video' ? alt : ''}</figcaption>
            )}
          </figure>
        );
      } else {
        tokens.push(
          <figure key={m.index} className="post-inline-figure">
            <img src={url} alt={alt} />
            {hasCaption && (
              <figcaption className="post-inline-caption">{alt}</figcaption>
            )}
          </figure>
        );
      }
    } else if (m.text.startsWith('[')) {
      const label = m.text.slice(1, m.text.indexOf(']'));
      const url = m.text.slice(m.text.indexOf('(') + 1, -1);
      tokens.push(<a key={m.index} href={url} target="_blank" rel="noopener noreferrer">{label}</a>);
    }
    
    lastIdx = m.index + m.text.length;
  }
  
  if (lastIdx < text.length) {
    tokens.push(text.slice(lastIdx));
  }
  
  return tokens;
}

export default function PostDetail({ post, isAdmin, onBack, onEdit, onDelete }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState('');

  useEffect(() => {
    if (post && post.file) {
      setLoading(true);
      fetch(`./posts/${post.file}?t=${Date.now()}`)
        .then(res => {
          if (!res.ok) throw new Error("İçerik dosyası bulunamadı.");
          return res.text();
        })
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setContent("### Hata\nYazı içeriği yüklenirken bir hata oluştu.");
          setLoading(false);
        });
    }
  }, [post]);

  // Delete post via GitHub API
  const handleDeletePost = async () => {
    if (!window.confirm(`"${post.title}" başlıklı yazıyı kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) {
      return;
    }

    const token = localStorage.getItem('githubToken');
    if (!token) {
      alert("Yazıyı silmek için GitHub erişim anahtarınızın kayıtlı olması gerekir. Lütfen editör sayfasından anahtarınızı girin.");
      return;
    }

    setIsDeleting(true);
    setDeleteStatus("Silme işlemi başlatılıyor...");

    const owner = "LuneNoir14";
    const repo = "Rotstead-Develop";
    const branch = "main";
    const headers = {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json",
    };

    try {
      // Step 1: Delete the .md file
      setDeleteStatus(`${post.file} dosyası siliniyor...`);
      const mdUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/posts/${post.file}?ref=${branch}`;
      const mdRes = await fetch(mdUrl, { headers });
      
      if (mdRes.ok) {
        const mdData = await mdRes.json();
        const deleteRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/public/posts/${post.file}`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            message: `Delete post: ${post.title}`,
            sha: mdData.sha,
            branch,
          })
        });
        if (!deleteRes.ok) throw new Error("Makale dosyası silinemedi.");
      }

      // Step 2: Update registry.json to remove the post
      setDeleteStatus("Kütüphane güncelleniyor...");
      const registryUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/posts/registry.json?ref=${branch}`;
      const regRes = await fetch(registryUrl, { headers });
      if (!regRes.ok) throw new Error("Kütüphane dosyası indirilemedi.");
      const regData = await regRes.json();

      let base64Content = regData.content || "";
      if (!base64Content && regData.sha) {
        // File is > 1MB, fetch via Blobs API
        const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${regData.sha}`;
        const blobRes = await fetch(blobUrl, { headers });
        if (blobRes.ok) {
          const blobData = await blobRes.json();
          base64Content = blobData.content || "";
        } else {
          throw new Error("Kütüphane dosya içeriği (blob) indirilemedi.");
        }
      }

      if (!base64Content) {
        throw new Error("Kütüphane dosyası boş veya okunamadı.");
      }

      const decodedRegistryText = new TextDecoder("utf-8").decode(
        Uint8Array.from(atob(base64Content.replace(/\s/g, '')), c => c.charCodeAt(0))
      );
      let registryArray = JSON.parse(decodedRegistryText);

      // Remove the post from registry
      registryArray = registryArray.filter(p => p.id !== post.id);

      const updatedRegistryText = JSON.stringify(registryArray, null, 2);
      const encoder = new TextEncoder();
      const registryBytes = encoder.encode(updatedRegistryText);
      const registryBase64 = uint8ArrayToBase64(registryBytes);

      const regCommitRes = await fetch(registryUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Remove post from registry: ${post.title}`,
          content: registryBase64,
          sha: regData.sha,
          branch,
        })
      });

      if (!regCommitRes.ok) throw new Error("Kütüphane güncellenemedi.");

      setDeleteStatus("Yazı başarıyla silindi!");
      alert("Yazı başarıyla silindi! Siteniz Render'da güncellenmeye başlandı.");
      
      // Notify parent and navigate
      if (onDelete) onDelete(post.id);

    } catch (error) {
      console.error(error);
      alert(`Silme sırasında hata oluştu: ${error.message}`);
      setDeleteStatus(`Hata: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!post) return null;

  return (
    <article className="article-blog-post">
      <button className="button small-button post-back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Geri Dön</span>
      </button>

      <div className="post-header">
        <h1 className="post-title">{post.title}</h1>
        <div className="detail-text meta-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {post.readTime} okuma süresi
          </span>
          <span>•</span>
          <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={12} />
            {post.category}
          </span>
        </div>
      </div>

      <img className="post-banner-img" src={post.image} alt={post.title} />

      <div className="post-content">
        {loading ? (
          <p style={{ fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>Yükleniyor...</p>
        ) : (
          parseMarkdown(content)
        )}
      </div>

      {/* Admin Actions: Edit & Delete */}
      {!loading && isAdmin && (
        <div style={{ 
          marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' 
        }}>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            {onEdit && (
              <button className="button" onClick={() => onEdit(post, content)}>
                <PenLine size={16} />
                <span>Yazıyı Düzenle</span>
              </button>
            )}
            <button 
              className="button delete-post-btn" 
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              <span>{isDeleting ? 'Siliniyor...' : 'Yazıyı Sil'}</span>
            </button>
          </div>
          {deleteStatus && (
            <span style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--accent-color)' }}>
              {deleteStatus}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
