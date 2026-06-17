import React from 'react';
import { Calendar, Clock, Tag } from 'lucide-react';

export default function BlogCard({ post, onSelect }) {
  const handleCardClick = (e) => {
    e.preventDefault();
    onSelect(post.id);
  };

  return (
    <article>
      <a href={`#post-${post.id}`} className="big-button article-button" onClick={handleCardClick}>
        <img 
          className="article-link-image" 
          src={post.image} 
          alt={post.title} 
          loading="lazy" 
        />
        <div className="article-link-details">
          <h2>{post.title}</h2>
          <div className="detail-text meta-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} />
              <time datetime={post.date}>
                {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {post.readTime} okuma süresi
            </span>
            <span>•</span>
            <span 
              className="category-badge"
              style={{ 
                color: 'var(--accent-color)', 
                fontWeight: 'bold',
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}
            >
              <Tag size={12} />
              {post.category}
            </span>
          </div>
          <hr />
          <p className="excerpt">{post.excerpt}</p>
        </div>
      </a>
    </article>
  );
}
