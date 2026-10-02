import { useEffect, useState } from 'react';
import { getGallery } from '../api/gallery.js';
import StatusMessage from '../components/StatusMessage.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    document.title = 'Gallery | KESARIYA Dandiya Nights';
    getGallery()
      .then((response) => { setItems(response.data ?? []); setStatus('success'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <PublicLayout>
      <main className="page-shell gallery-page">
        <section className="content-section" aria-labelledby="gallery-heading">
          <p className="eyebrow">Moments from KESARIYA</p>
          <h1 id="gallery-heading">Gallery</h1>
          {status === 'loading' && <StatusMessage title="Loading gallery" message="Fetching published gallery items." />}
          {status === 'error' && <StatusMessage title="Gallery unavailable" message="Gallery information could not be loaded right now." tone="error" />}
          {status === 'success' && items.length === 0 && <StatusMessage title="No gallery items" message="Gallery items have not been published yet." />}
          {status === 'success' && items.length > 0 && (
            <div className="gallery-grid">
              {items.map((item) => (
                <article className="gallery-card" key={item.id}>
                  {item.media_type === 'image' ? (
                    <img src={item.media_url} alt={item.alt_text || item.title || 'KESARIYA Dandiya Nights gallery'} loading="lazy" />
                  ) : (
                    <a href={item.media_url} target="_blank" rel="noreferrer" aria-label={`Open ${item.title || 'gallery video'}`}>
                      <span className="gallery-video-placeholder">Video</span>
                    </a>
                  )}
                  {item.title && <h2>{item.title}</h2>}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
