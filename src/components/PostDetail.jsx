import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';

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
      // Find alignment or headers
      // If row 1 is header, row 2 is separator (---)
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
        // End of code block
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
        // Start of code block
        inCodeBlock = true;
        codeLang = line.trim().slice(3);
        // Flush any active lists/tables before code block
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
      // Flush lists
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
    // Paragraph
    else {
      elements.push(<p key={i}>{parseInlineMarkdown(trimmed)}</p>);
    }
  }
  
  // Flush anything remaining at end of file
  flushList(lines.length);
  flushTable(lines.length);
  
  return elements;
}

// Simple inline parser for **bold** and `code` and [links](url)
function parseInlineMarkdown(text) {
  if (!text) return '';
  
  const tokens = [];
  let remaining = text;
  
  // Matches: **bold**, `inline code`, [link text](url)
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
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
  
  let currentKey = 0;
  matches.forEach((m, idx) => {
    // Add text before match
    if (m.index > lastIdx) {
      tokens.push(text.slice(lastIdx, m.index));
    }
    
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
  
  if (lastIdx < text.length) {
    tokens.push(text.slice(lastIdx));
  }
  
  return tokens;
}

export default function PostDetail({ post, onBack }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (post && post.file) {
      setLoading(true);
      fetch(`./posts/${post.file}`)
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
    </article>
  );
}
