import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BlogCard from './components/BlogCard';
import PostDetail from './components/PostDetail';
import About from './components/About';
import AdminEditor from './components/AdminEditor';
import Footer from './components/Footer';
import { Search, ChevronRight, Activity, BookOpen, MessageCircle, Heart, Coffee, Droplet, Zap } from 'lucide-react';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 3;

  // Load registry on mount
  useEffect(() => {
    setLoading(true);
    fetch('./posts/registry.json')
      .then(res => {
        if (!res.ok) throw new Error("Makale listesi yüklenemedi.");
        return res.json();
      })
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setPosts(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Sync state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/post/')) {
        const id = hash.replace('#/post/', '');
        setSelectedPostId(id);
        setCurrentTab('post');
        window.scrollTo(0, 0);
      } else if (hash === '#/about') {
        setCurrentTab('about');
        window.scrollTo(0, 0);
      } else if (hash === '#/editor') {
        setCurrentTab('editor');
        window.scrollTo(0, 0);
      } else if (hash.startsWith('#/category/')) {
        const cat = decodeURIComponent(hash.replace('#/category/', ''));
        setSelectedCategory(cat);
        setCurrentTab('home');
        setCurrentPage(1);
        window.scrollTo(0, 0);
      } else {
        setCurrentTab('home');
        setSelectedPostId(null);
        window.scrollTo(0, 0);
      }
    };

    handleHashChange(); // Run on init
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Calculate unique categories and count of posts in each
  const categoryCounts = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {});

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setCurrentPage(1);
    window.location.hash = '#/';
  };

  const selectPost = (id) => {
    window.location.hash = `#/post/${id}`;
  };

  const selectCategory = (category) => {
    if (category === null) {
      resetFilters();
    } else {
      window.location.hash = `#/category/${encodeURIComponent(category)}`;
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory ? post.category === selectedCategory : true;
    const matchesSearch = searchQuery
      ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Pagination calculations
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo(0, 300);
    }
  };

  // Find active post
  const activePost = posts.find(p => p.id === selectedPostId);

  return (
    <>
      <Header 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          if (tab === 'home') window.location.hash = '#/';
          if (tab === 'about') window.location.hash = '#/about';
          if (tab === 'editor') window.location.hash = '#/editor';
        }} 
        resetFilters={resetFilters} 
      />

      <main style={{ marginTop: 'var(--primary-spacing)' }}>
        {currentTab === 'post' && activePost ? (
          <PostDetail 
            post={activePost} 
            onBack={() => {
              if (selectedCategory) {
                window.location.hash = `#/category/${encodeURIComponent(selectedCategory)}`;
              } else {
                window.location.hash = '#/';
              }
            }} 
          />
        ) : currentTab === 'about' ? (
          <About />
        ) : currentTab === 'editor' ? (
          <AdminEditor onBack={() => { window.location.hash = '#/'; }} />
        ) : (
          <div className="home-main">
            {/* Sidebar taxonomies */}
            <aside className="home-taxonomies">
              

              {/* Categories Widget */}
              <div className="glass-card widget">
                <h3 className="widget-title">
                  <BookOpen size={18} /> Kategoriler
                </h3>
                <ul className="widget-list">
                  <li>
                    <a 
                      href="#" 
                      className="widget-link" 
                      onClick={(e) => { e.preventDefault(); selectCategory(null); }}
                      style={{ fontWeight: !selectedCategory ? 'bold' : 'normal' }}
                    >
                      <ChevronRight size={14} />
                      Tüm Yazılar
                    </a>
                    <span className="widget-count">{posts.length}</span>
                  </li>
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <li key={cat}>
                      <a 
                        href="#" 
                        className="widget-link" 
                        onClick={(e) => { e.preventDefault(); selectCategory(cat); }}
                        style={{ fontWeight: selectedCategory === cat ? 'bold' : 'normal' }}
                      >
                        <ChevronRight size={14} />
                        {cat}
                      </a>
                      <span className="widget-count">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick social widget */}
              <div className="glass-card widget">
                <h3 className="widget-title">
                  <MessageCircle size={18} /> Topluluk
                </h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Geliştirme süreçlerini yakından takip etmek için Discord sunucumuza katılabilirsiniz.
                </p>
                <a 
                  href="https://discord.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="button small-button"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Discord Sunucumuz
                </a>
              </div>

            </aside>

            {/* Main column list of posts */}
            <section className="home-pages">
              
              {/* Category Header (if filtering) */}
              {selectedCategory && (
                <div className="glass-card" style={{ padding: '0.8rem var(--primary-spacing)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                    Kategori » <span style={{ color: 'var(--accent-color)' }}>{selectedCategory}</span>
                  </h2>
                  <button className="button small-button" onClick={resetFilters}>Temizle</button>
                </div>
              )}

              {/* Search Widget */}
              <div className="search-container">
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Yazılarda ara... (örn: zombi, fizik, ağ)" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchQuery && (
                  <button className="button" onClick={() => setSearchQuery('')}>Sıfırla</button>
                )}
              </div>

              {/* Posts Cards Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--secondary-spacing)' }}>
                {loading ? (
                  <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>Yazılar yükleniyor...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Henüz hiç yazı eklenmemiş!</p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--secondary-color)' }}>
                      Blogunuzu doldurmak için üst menüdeki <strong>"Yazı Ekle"</strong> butonuna tıklayarak ilk makalenizi oluşturabilirsiniz.
                    </p>
                    <a href="#/editor" className="button" style={{ marginTop: '0.5rem' }}>
                      İlk Yazıyı Ekle
                    </a>
                  </div>
                ) : currentPosts.length > 0 ? (
                  currentPosts.map(post => (
                    <BlogCard key={post.id} post={post} onSelect={selectPost} />
                  ))
                ) : (
                  <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Aradığınız kriterlere uygun yazı bulunamadı.</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--detail-color)', marginTop: '0.5rem' }}>Farklı anahtar kelimeler aramayı veya filtreleri temizlemeyi deneyin.</p>
                    <button className="button small-button" style={{ marginTop: '1rem' }} onClick={resetFilters}>
                      Filtreleri Temizle
                    </button>
                  </div>
                )}
              </div>

              {/* Pagination controls */}
              {!loading && totalPages > 1 && (
                <nav>
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <a href="#" className="page-item-link" onClick={(e) => { e.preventDefault(); paginate(1); }} aria-label="First">
                        ««
                      </a>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <a href="#" className="page-item-link" onClick={(e) => { e.preventDefault(); paginate(currentPage - 1); }} aria-label="Previous">
                        «
                      </a>
                    </li>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                        <a href="#" className="page-item-link" onClick={(e) => { e.preventDefault(); paginate(pageNum); }}>
                          {pageNum}
                        </a>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <a href="#" className="page-item-link" onClick={(e) => { e.preventDefault(); paginate(currentPage + 1); }} aria-label="Next">
                        »
                      </a>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <a href="#" className="page-item-link" onClick={(e) => { e.preventDefault(); paginate(totalPages); }} aria-label="Last">
                        »»
                      </a>
                    </li>
                  </ul>
                </nav>
              )}

            </section>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
