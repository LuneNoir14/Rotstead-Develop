import React, { useState, useRef } from 'react';
import { 
  PenTool, Eye, FileText, Check, Copy, 
  Bold, Italic, Heading2, Heading3, Code, Quote, Table, Image as ImageIcon, Video, Link as LinkIcon, 
  Download, Upload, ArrowLeft, X, Trash2, Plus
} from 'lucide-react';

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
    } else if (/^!\[.*?\]\(.*?\)$/.test(trimmed)) {
      elements.push(
        <React.Fragment key={i}>
          {parseInlineMarkdown(trimmed)}
        </React.Fragment>
      );
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
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|!\[.*?\]\(.*?\))/g;
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
    
    if (tokenText.startsWith('![') && tokenText.includes('](')) {
      const closeBracket = tokenText.indexOf(']');
      const altText = tokenText.slice(2, closeBracket);
      const mediaUrl = tokenText.slice(closeBracket + 2, -1);
      tokens.push(renderMarkdownMedia(altText, mediaUrl, currentKey++));
    } else if (tokenText.startsWith('**') && tokenText.endsWith('**')) {
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

function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getYouTubeEmbedUrl(link) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = link.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
}

function isVideoMedia(url, alt = '') {
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
  return (
    url.startsWith('data:video/') ||
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    alt.toLowerCase() === 'video'
  );
}

function getMediaAltForInsert(file) {
  return file.type.startsWith('video/') ? 'video' : file.name;
}

function getDataUrlExtension(dataUrl) {
  const mime = dataUrl.match(/^data:([^;]+);/)?.[1] || '';
  const extensions = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogg',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return extensions[mime] || mime.split('/')[1] || 'bin';
}

function createSafeMediaFileName(media) {
  const extension = getDataUrlExtension(media.data);
  const rawName = (media.name || media.id).replace(/\.[^/.]+$/, '');
  const safeBase = rawName
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || media.id;
  return `${safeBase}-${media.id}.${extension}`;
}

async function getGitHubErrorMessage(response, fallback) {
  let detail = '';
  try {
    const data = await response.json();
    detail = data?.message || JSON.stringify(data);
  } catch {
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
  }
  return `${fallback} GitHub ${response.status}${detail ? `: ${detail}` : ''}`;
}

function renderMarkdownMedia(altText, mediaUrl, key) {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(mediaUrl);
  const isVideo = isVideoMedia(mediaUrl, altText);
  const hasCaption = altText && altText.trim() && !/^img_\d+$/i.test(altText) && altText !== 'Görsel' && altText !== 'image' && altText !== 'video';

  if (youtubeEmbedUrl) {
    return (
      <figure key={key} className="post-inline-figure" style={{ width: '100%', maxWidth: '650px' }}>
        <div className="post-video-frame">
          <iframe
            src={youtubeEmbedUrl}
            title={altText || 'YouTube Video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {hasCaption && <figcaption className="post-inline-caption">{altText}</figcaption>}
      </figure>
    );
  }

  if (isVideo) {
    return (
      <figure key={key} className="post-inline-figure">
        <video src={mediaUrl} controls preload="metadata" />
        {hasCaption && <figcaption className="post-inline-caption">{altText}</figcaption>}
      </figure>
    );
  }

  return (
    <img
      key={key}
      src={mediaUrl}
      alt={altText}
      style={{ maxWidth: '100%', borderRadius: '4px', margin: '0.8rem 0', display: 'block', border: '1px solid var(--border-color)' }}
    />
  );
}

export default function AdminEditor({ onBack, editData }) {
  // Process initial content to extract any existing base64 media into embedded state
  const [initialProcessed] = useState(() => {
    const rawContent = editData?.content || '';
    if (!rawContent) return { content: '', images: [], nextId: 0 };
    
    const images = [];
    let idx = 0;
    const newContent = rawContent.replace(
      /!\[([^\]]*)\]\((data:(?:image|video)\/[^)]+)\)/g,
      (fullMatch, alt, data) => {
        const id = `img_${idx}`;
        const type = data.startsWith('data:video/') ? 'video' : 'image';
        images.push({ id, name: alt || (type === 'video' ? `Video ${idx + 1}` : `Görsel ${idx + 1}`), data, type });
        idx++;
        return `![${alt}](embedded:${id})`;
      }
    );
    
    return { content: newContent, images, nextId: idx };
  });

  const [title, setTitle] = useState(editData ? editData.title : '');
  const [category, setCategory] = useState(editData ? editData.category : 'Geliştirme Günlükleri');
  const [image, setImage] = useState(editData ? editData.image : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400');
  const [excerpt, setExcerpt] = useState(editData ? editData.excerpt : '');
  const [content, setContent] = useState(initialProcessed.content || (editData?.content || ''));
  
  // Embedded media management
  const [embeddedImages, setEmbeddedImages] = useState(initialProcessed.images);
  const imageIdCounter = useRef(initialProcessed.nextId);
  
  const [copiedRegistry, setCopiedRegistry] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [githubToken, setGithubToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('githubToken') || '';
    }
    return '';
  });
  const [tokenInput, setTokenInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState('');

  // --- Embedded Media Management ---
  const addEmbeddedImage = (name, base64Data, type = 'image') => {
    const id = `img_${imageIdCounter.current++}`;
    setEmbeddedImages(prev => [...prev, { id, name, data: base64Data, type }]);
    return id;
  };
  
  const removeEmbeddedImage = (id) => {
    setEmbeddedImages(prev => prev.filter(img => img.id !== id));
    setContent(prev => prev.replace(new RegExp(`!\\[[^\\]]*\\]\\(embedded:${id}\\)`, 'g'), ''));
  };
  
  const resolveEmbeddedImages = (text, mediaUrlById = {}) => {
    return text.replace(/!\[([^\]]*)\]\(embedded:(img_\d+)\)/g, (fullMatch, alt, id) => {
      if (mediaUrlById[id]) return `![${alt || 'media'}](${mediaUrlById[id]})`;
      const img = embeddedImages.find(i => i.id === id);
      if (img) return `![${alt}](${img.data})`;
      return fullMatch;
    });
  };

  const getEmbeddedMediaReferences = () => {
    const refs = [];
    const seen = new Set();
    content.replace(/!\[([^\]]*)\]\(embedded:(img_\d+)\)/g, (fullMatch, alt, id) => {
      if (seen.has(id)) return fullMatch;
      const media = embeddedImages.find(i => i.id === id);
      if (media) {
        refs.push({ ...media, alt });
        seen.add(id);
      }
      return fullMatch;
    });
    return refs;
  };
  // ---

  const handleSaveToken = () => {
    if (!tokenInput.trim()) return;
    localStorage.setItem('githubToken', tokenInput.trim());
    setGithubToken(tokenInput.trim());
    setTokenInput('');
  };

  const handleDeleteToken = () => {
    if (window.confirm("GitHub erişim anahtarınızı silmek istediğinize emin misiniz?")) {
      localStorage.removeItem('githubToken');
      setGithubToken('');
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Url = event.target?.result;
            if (base64Url) {
              const id = addEmbeddedImage('Yapıştırılan Görsel', base64Url, 'image');
              insertFormatting(`![Yapıştırılan Görsel](embedded:${id})`);
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleDrop = (e) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result;
        if (base64Url) {
          const type = file.type.startsWith("video/") ? 'video' : 'image';
          const alt = getMediaAltForInsert(file);
          const id = addEmbeddedImage(file.name, base64Url, type);
          insertFormatting(`![${alt}](embedded:${id})`);
        }
      };
      reader.readAsDataURL(file);
      e.preventDefault();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const publishToGithub = async () => {
    const token = localStorage.getItem('githubToken');
    if (!token) {
      alert("Lütfen önce GitHub Erişim Anahtarınızı (Token) girin.");
      return;
    }

    setIsPublishing(true);
    setPublishStatus("Yayınlama başlatılıyor...");

    const owner = "LuneNoir14";
    const repo = "Rotstead-Develop";
    const branch = "main";
    const headers = {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setPublishStatus("Makale kütüphanesi (registry.json) indiriliyor...");
      const registryUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/posts/registry.json?ref=${branch}`;
      const regRes = await fetch(registryUrl, { headers });
      
      let regData = null;
      let registryArray = [];

      if (regRes.ok) {
        regData = await regRes.json();
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

        if (base64Content) {
          try {
            const decodedRegistryText = new TextDecoder("utf-8").decode(
              Uint8Array.from(atob(base64Content.replace(/\s/g, '')), c => c.charCodeAt(0))
            );
            registryArray = JSON.parse(decodedRegistryText);
            if (!Array.isArray(registryArray)) registryArray = [];
          } catch (parseErr) {
            console.error("registry.json parse hatası:", parseErr);
            throw new Error("Kütüphane dosyası (registry.json) ayrıştırılamadı.");
          }
        }
      } else if (regRes.status === 404) {
        // registry.json henüz yok, sıfırdan oluşturulacak
        console.log("registry.json bulunamadı, yeni oluşturulacak.");
        regData = null;
      } else {
        throw new Error(await getGitHubErrorMessage(regRes, "Makale kütüphanesi indirilemedi. Erişim anahtarınız hatalı veya yetersiz yetkilere sahip olabilir (repo yetkisi gerekli)."));
      }

      const existingIndex = registryArray.findIndex(p => p.id === slug);
      
      const newPostItem = {
        id: slug,
        title: title || 'Başlıksız Makale',
        category: category,
        date: todayDate,
        readTime: readTimeStr,
        image: image,
        excerpt: excerpt || 'Açıklama girilmedi.',
        file: `${slug}.md`
      };

      if (existingIndex > -1) {
        registryArray[existingIndex] = newPostItem;
      } else {
        registryArray.unshift(newPostItem);
      }

      const updatedRegistryText = JSON.stringify(registryArray, null, 2);
      const encoder = new TextEncoder();
      const registryBytes = encoder.encode(updatedRegistryText);
      const registryBase64 = uint8ArrayToBase64(registryBytes);

      setPublishStatus(`Makale metni (${slug}.md) yükleniyor...`);
      const markdownUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/posts/${slug}.md`;
      
      let mdSha = null;
      try {
        const mdCheckRes = await fetch(`${markdownUrl}?ref=${branch}`, { headers });
        if (mdCheckRes.ok) {
          const mdCheckData = await mdCheckRes.json();
          mdSha = mdCheckData.sha;
        }
      } catch (e) {
        console.log("Markdown checking failed or file doesn't exist yet.");
      }

      const mediaUrlById = {};
      const embeddedMedia = getEmbeddedMediaReferences();

      for (const media of embeddedMedia) {
        const mediaBase64 = media.data.split(',')[1];
        if (!mediaBase64) throw new Error(`${media.name} medya verisi okunamadı.`);

        const mediaFileName = createSafeMediaFileName(media);
        const mediaPath = `public/media/${slug}/${mediaFileName}`;
        const mediaUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${mediaPath}`;
        const publicMediaUrl = `/media/${slug}/${mediaFileName}`;

        setPublishStatus(`Medya yükleniyor: ${media.name}`);

        let mediaSha = null;
        const mediaCheckRes = await fetch(`${mediaUrl}?ref=${branch}`, { headers });
        if (mediaCheckRes.ok) {
          const mediaCheckData = await mediaCheckRes.json();
          mediaSha = mediaCheckData.sha;
        } else if (mediaCheckRes.status !== 404) {
          throw new Error(await getGitHubErrorMessage(mediaCheckRes, `${media.name} medya durumu kontrol edilemedi.`));
        }

        const mediaCommitRes = await fetch(mediaUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `Upload media for post: ${title}`,
            content: mediaBase64,
            branch,
            ...(mediaSha ? { sha: mediaSha } : {})
          })
        });

        if (!mediaCommitRes.ok) {
          throw new Error(await getGitHubErrorMessage(mediaCommitRes, `${media.name} medya dosyası yüklenemedi.`));
        }

        mediaUrlById[media.id] = publicMediaUrl;
      }

      const resolvedContent = resolveEmbeddedImages(content, mediaUrlById);
      if (resolvedContent.includes('data:image/') || resolvedContent.includes('data:video/')) {
        throw new Error("Markdown içinde gömülü medya verisi kaldı. Medyayı panelden yeniden ekleyin veya dış bağlantı kullanın.");
      }
      const mdBytes = encoder.encode(resolvedContent);
      const mdBase64 = uint8ArrayToBase64(mdBytes);

      const mdCommitRes = await fetch(markdownUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Publish post: ${title}`,
          content: mdBase64,
          branch,
          ...(mdSha ? { sha: mdSha } : {})
        })
      });

      if (!mdCommitRes.ok) throw new Error(await getGitHubErrorMessage(mdCommitRes, "Makale dosyası (.md) yüklenemedi."));

      setPublishStatus("Kütüphane (registry.json) güncelleniyor...");
      const regCommitRes = await fetch(registryUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Update registry for post: ${title}`,
          content: registryBase64,
          branch,
          ...(regData && regData.sha ? { sha: regData.sha } : {})
        })
      });

      if (!regCommitRes.ok) throw new Error(await getGitHubErrorMessage(regCommitRes, "Kütüphane dosyası (registry.json) güncellenemedi."));

      setPublishStatus("Yayınlama başarılı! Siteniz Render'da güncelleniyor (1-2 dakika sürebilir).");
      alert("Yazı başarıyla yayınlandı! Siteniz Render'da güncellenmeye başlandı. 1-2 dakika içinde aktif olacaktır.");
      
      setTimeout(() => {
        window.location.hash = '#/';
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert(`Yayınlama sırasında hata oluştu: ${error.message}`);
      setPublishStatus(`Hata: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

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
  const registryEntry = {
    id: slug,
    title: title || 'Başlıksız Makale',
    category: category,
    date: todayDate,
    readTime: readTimeStr,
    image: image,
    excerpt: excerpt || 'Açıklama girilmedi.',
    file: `${slug}.md`
  };
  const generatedJson = JSON.stringify(registryEntry, null, 2);

  // Truncated version for display (if cover image is base64, show short label)
  const displayEntry = { ...registryEntry };
  if (displayEntry.image && displayEntry.image.startsWith('data:image')) {
    displayEntry.image = `[Yerel Görsel - ${Math.round(displayEntry.image.length / 1024)} KB] (Kopyalamada tam veri dahil edilecektir)`;
  }
  const displayJson = JSON.stringify(displayEntry, null, 2);

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to insert formatting templates into the cursor position
  const insertFormatting = (beforeVal, afterVal = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    const replacement = beforeVal + (selected || '') + afterVal;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    setContent(newValue);
    
    // Focus back and set cursor selection range
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + beforeVal.length;
      textarea.selectionEnd = start + beforeVal.length + (selected || '').length;
    }, 50);
  };

  // Convert local media to embedded reference (no more raw base64 in textarea)
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result;
      if (base64Url) {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const alt = getMediaAltForInsert(file);
        const id = addEmbeddedImage(file.name, base64Url, type);
        insertFormatting(`![${alt}](embedded:${id})`);
        setShowImagePanel(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle cover image file selection
  const handleCoverImageFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result;
        if (base64Url) setImage(base64Url);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add image/video via URL
  const handleAddImageUrl = (e) => {
    e.preventDefault();
    const mediaUrl = imageUrlInput.trim();
    if (!mediaUrl) return;
    const defaultAlt = isVideoMedia(mediaUrl) || getYouTubeEmbedUrl(mediaUrl) ? 'video' : 'Görsel';
    insertFormatting(`![${imageAltInput || defaultAlt}](${mediaUrl})`);
    setImageUrlInput('');
    setImageAltInput('');
    setShowImagePanel(false);
  };

  // Download .md file with resolved images
  const downloadMarkdownFile = () => {
    const resolvedContent = resolveEmbeddedImages(content);
    const element = document.createElement("a");
    const file = new Blob([resolvedContent], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${slug}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Check if cover image is base64
  const isCoverBase64 = image && image.startsWith('data:image');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primary-spacing)', maxWidth: '70rem', margin: '0 auto', width: '100%' }}>
      
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
            <h2>Yazı Detayları</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: '0.8rem', marginTop: 'var(--secondary-spacing)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label htmlFor="post-title" style={{ fontWeight: '600', fontSize: '0.95rem' }}>Başlık</label>
                <input 
                  id="post-title"
                  type="text" 
                  className="search-input" 
                  placeholder="örn: Alpha v0.1.2 Güncelleme Notları" 
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

              {/* Cover Image - with thumbnail preview for base64 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: 'span 2' }}>
                <label style={{ fontWeight: '600', fontSize: '0.95rem' }}>Kapak Resmi</label>
                
                {isCoverBase64 ? (
                  <div className="cover-image-preview">
                    <img 
                      src={image} 
                      alt="Kapak Önizleme" 
                      style={{ 
                        width: '10rem', height: '6.5rem', objectFit: 'cover', 
                        borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' 
                      }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.88rem', color: 'var(--secondary-color)', fontWeight: '500' }}>
                        ✅ Yerel görsel yüklendi ({Math.round(image.length / 1024)} KB)
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <label className="button small-button" style={{ cursor: 'pointer' }}>
                          <Upload size={12} />
                          <span>Değiştir</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleCoverImageFile}
                          />
                        </label>
                        <button className="button small-button" onClick={() => setImage('')} style={{ borderColor: 'var(--game-red)', color: 'var(--game-red)' }}>
                          <X size={12} />
                          <span>Kaldır</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--detail-color)' }}>Görsel URL veya yerel dosya seçin</span>
                      <label className="button small-button" style={{ cursor: 'pointer', padding: '2px 8px', fontSize: '0.8rem' }}>
                        <Upload size={12} />
                        <span>Yerel Görsel Seç</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={handleCoverImageFile}
                        />
                      </label>
                    </div>
                    <input 
                      id="post-image"
                      type="text" 
                      className="search-input" 
                      placeholder="https://images.unsplash.com/..." 
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                    {image && !isCoverBase64 && (
                      <img 
                        src={image} 
                        alt="Kapak Önizleme" 
                        style={{ 
                          marginTop: '0.5rem', width: '10rem', height: '6.5rem', objectFit: 'cover',
                          borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' 
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                )}
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

          {/* Formatting & Editor Panel */}
          <div className="glass-card default-padding" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2>Yazı İçeriği</h2>
              
              {/* Text formatting toolbar */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', backgroundColor: 'var(--secondary-detail-color)', padding: '4px', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                <button type="button" className="button small-button" style={{ padding: '4px 8px' }} title="Kalın" onClick={() => insertFormatting('**', '**')}>
                  <Bold size={14} />
                </button>
                <button type="button" className="button small-button" style={{ padding: '4px 8px' }} title="Eğik" onClick={() => insertFormatting('*', '*')}>
                  <Italic size={14} />
                </button>
                <button type="button" className="button small-button" style={{ padding: '4px 8px' }} title="Başlık 2" onClick={() => insertFormatting('\n## ', '\n')}>
                  <Heading2 size={14} />
                </button>
                <button type="button" className="button small-button" style={{ padding: '4px 8px' }} title="Başlık 3" onClick={() => insertFormatting('\n### ', '\n')}>
                  <Heading3 size={14} />
                </button>
                <button type="button" className="button small-button" style={{ padding: '4px 8px' }} title="Kod Bloğu" onClick={() => insertFormatting('\n```csharp\n', '\n```\n')}>
                  <Code size={14} />
                </button>
                <button type="button" className="button small-button" style={{ padding: '4px 8px' }} title="Alıntı" onClick={() => insertFormatting('\n> ', '\n')}>
                  <Quote size={14} />
                </button>
                <button type="button" className="button small-button" style={{ padding: '4px 8px' }} title="Tablo Ekle" onClick={() => insertFormatting('\n| Başlık 1 | Başlık 2 |\n| :--- | :--- |\n| Hücre 1 | Hücre 2 |\n')}>
                  <Table size={14} />
                </button>
                <button type="button" className="button small-button" style={{ padding: '4px 8px', color: 'var(--accent-color)' }} title="Medya Ekle/Yükle" onClick={() => setShowImagePanel(!showImagePanel)}>
                  <ImageIcon size={14} />
                  <Video size={14} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Medya Ekle</span>
                </button>
              </div>
            </div>

            {/* Expansible Image upload panel */}
            {showImagePanel && (
              <div className="glass-card" style={{ padding: '1rem', borderStyle: 'dashed', borderColor: 'var(--accent-color)', backgroundColor: 'rgba(224, 122, 95, 0.05)', marginTop: '0.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Medya Ekleme Paneli</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: '1rem' }}>
                  
                  {/* File Upload Zone */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--background-color)', textAlign: 'center' }}>
                    <Upload size={24} style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>Bilgisayardan Sürükleyin veya Seçin</p>
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      style={{ display: 'none' }} 
                      ref={fileInputRef} 
                      onChange={handleImageFileChange}
                    />
                    <button type="button" className="button small-button" onClick={() => fileInputRef.current?.click()}>
                      Dosya Seç
                    </button>
                    <small style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--detail-color)' }}>
                      Görsel veya kısa video otomatik olarak yazıya gömülecektir.
                    </small>
                  </div>

                  {/* URL Input Form */}
                  <form onSubmit={handleAddImageUrl} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label htmlFor="img-url" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Medya İnternet Linki (URL)</label>
                      <input 
                        id="img-url"
                        type="text" 
                        className="search-input" 
                        placeholder="https://.../video.mp4 veya YouTube linki" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label htmlFor="img-alt" style={{ fontSize: '0.8rem', fontWeight: '600' }}>Açıklama</label>
                      <input 
                        id="img-alt"
                        type="text" 
                        className="search-input" 
                        placeholder="örn: Karakter envanter görüntüsü" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        value={imageAltInput}
                        onChange={(e) => setImageAltInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="button small-button" style={{ alignSelf: 'flex-start' }}>
                      <LinkIcon size={12} />
                      <span>Link ile Ekle</span>
                    </button>
                  </form>

                </div>

                {/* Embedded Images Gallery */}
                {embeddedImages.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <ImageIcon size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                      Gömülü Medyalar ({embeddedImages.length})
                    </h4>
                    <div className="embedded-images-gallery">
                      {embeddedImages.map((img) => (
                        <div key={img.id} className="embedded-image-item">
                          {(img.type === 'video' || img.data.startsWith('data:video/')) ? (
                            <video src={img.data} muted preload="metadata" />
                          ) : (
                            <img src={img.data} alt={img.name} />
                          )}
                          <span style={{ fontSize: '0.72rem', color: 'var(--detail-color)', textAlign: 'center', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                            {img.name}
                          </span>
                          <div className="embedded-image-actions">
                            <button 
                              type="button" 
                              className="button small-button" 
                              title="Yazıya referans ekle"
                              onClick={() => insertFormatting(`![${(img.type === 'video' || img.data.startsWith('data:video/')) ? 'video' : img.name}](embedded:${img.id})`)}
                            >
                              <Plus size={10} />
                            </button>
                            <button 
                              type="button" 
                              className="button small-button delete-img-btn" 
                              title="Medyayı sil"
                              onClick={() => removeEmbeddedImage(img.id)}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Embedded images indicator (when panel is closed) */}
            {!showImagePanel && embeddedImages.length > 0 && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem',
                backgroundColor: 'var(--secondary-detail-color)', borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--secondary-color)'
              }}>
                <ImageIcon size={13} />
                <span>{embeddedImages.length} gömülü medya</span>
                <button 
                  type="button" 
                  className="button small-button" 
                  style={{ padding: '2px 8px', fontSize: '0.75rem', marginLeft: 'auto' }}
                  onClick={() => setShowImagePanel(true)}
                >
                  Medyaları Göster
                </button>
              </div>
            )}

            <textarea 
              id="post-content-area"
              ref={textareaRef}
              className="search-input" 
              rows="15" 
              placeholder="Yazı içeriğinizi buraya yazın... (Görselleri yapıştırabilir; görsel/video dosyalarını sürükleyebilirsiniz)" 
              style={{ resize: 'vertical', minHeight: '18rem', fontFamily: 'monospace', marginTop: '0.5rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          </div>

          {/* Doğrudan Sitede Yayınla Panel */}
          <div className="glass-card default-padding" style={{ border: '1px solid var(--accent-color)', backgroundColor: 'rgba(224, 122, 95, 0.03)' }}>
            <h2>Doğrudan Sitede Yayınla (Önerilen)</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--secondary-color)', marginTop: '0.2rem', marginBottom: '1rem' }}>
              Herhangi bir dosya indirme veya GitHub Desktop işlemiyle uğraşmadan yazınızı doğrudan bu tarayıcı üzerinden yayına alabilirsiniz.
            </p>

            {!githubToken ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '30rem' }}>
                <label htmlFor="github-token" style={{ fontWeight: '600', fontSize: '0.9rem' }}>GitHub Kişisel Erişim Anahtarı (Token)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    id="github-token"
                    type="password" 
                    className="search-input" 
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  <button className="button" onClick={handleSaveToken}>Kaydet</button>
                </div>
                <small style={{ color: 'var(--detail-color)', fontSize: '0.8rem' }}>
                  Erişim anahtarınız sadece kendi tarayıcınızın hafızasında tutulur, tamamen güvenlidir. Nasıl alınacağını öğrenmek için <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline' }}>tıklayın</a> (Gerekli yetki: <code>repo</code>).
                </small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--game-yellow)' }}></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>GitHub Bağlantısı Hazır (LuneNoir14/Rotstead-Develop)</span>
                  </div>
                  <button className="button small-button" style={{ borderColor: 'var(--game-red)', color: 'var(--game-red)' }} onClick={handleDeleteToken}>
                    Anahtarı Sil / Değiştir
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    className="button" 
                    onClick={publishToGithub} 
                    disabled={isPublishing || !title.trim() || !content.trim()}
                    style={{ padding: '0.8rem 1.5rem', fontSize: '1rem', fontWeight: 'bold', backgroundColor: 'var(--accent-color)', color: 'white' }}
                  >
                    {isPublishing ? 'Yayınlanıyor...' : 'Yazıyı Yayınla (Push)'}
                  </button>
                  {publishStatus && (
                    <span style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--accent-color)' }}>
                      {publishStatus}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Yayına Alma Kodu Üretici */}
          <div className="glass-card default-padding">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <h2>Yazıyı Yayınlama Kodları</h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--secondary-color)', marginTop: '0.2rem' }}>
                  Yazınız bittiğinde aşağıdaki adımları sırayla izleyerek sitenizde yayınlayabilirsiniz.
                </p>
              </div>
              <button className="button" onClick={downloadMarkdownFile}>
                <Download size={16} />
                <span>Yazı Dosyasını İndir (.md)</span>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <strong>Adım 1: Bu JSON bloğunu kopyalayıp <code>public/posts/registry.json</code> dosyasının en üstüne (köşeli parantezin içine) yapıştırın:</strong>
                  <button className="button small-button" onClick={() => copyToClipboard(generatedJson, setCopiedRegistry)}>
                    {copiedRegistry ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedRegistry ? 'Kopyalandı!' : 'Kopyala'}</span>
                  </button>
                </div>
                <pre style={{ backgroundColor: 'var(--secondary-detail-color)', padding: '0.8rem', borderRadius: 'var(--border-radius)', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid var(--border-color)', maxHeight: '16rem', overflow: 'auto' }}>
                  <code>{displayJson}</code>
                </pre>
              </div>

              <div className="glass-card" style={{ borderStyle: 'dashed', borderColor: 'var(--accent-color)', padding: '1rem', backgroundColor: 'var(--secondary-detail-color)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)', marginBottom: '0.4rem' }}>
                  <FileText size={18} /> Adım 2: Makale Dosyasını Kaydedin
                </h4>
                <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.9rem' }}>
                  <li>Yukarıdaki <strong>"Yazı Dosyasını İndir (.md)"</strong> butonuna basarak dosyayı indirin.</li>
                  <li>İndirilen dosyayı projenizdeki <strong><code>public/posts/</code></strong> klasörünün içine yerleştirin (ismi otomatik olarak <code>{slug}.md</code> olacaktır).</li>
                  <li>GitHub Desktop uygulamasını açıp yaptığınız bu değişiklikleri commitleyin ve pushlayın!</li>
                </ol>
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* Blog Post Live Style Preview */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primary-spacing)' }}>
          <div className="glass-card" style={{ padding: '0.6rem 1.2rem', textAlign: 'center', backgroundColor: 'var(--accent-color)', color: 'white', fontWeight: 'bold', borderRadius: 'var(--border-radius)' }}>
            Önizleme Modu (Canlı sitenizde bu şekilde görünecektir)
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
              {previewMarkdown(resolveEmbeddedImages(content))}
            </div>
          </article>
        </div>
      )}

    </div>
  );
}
