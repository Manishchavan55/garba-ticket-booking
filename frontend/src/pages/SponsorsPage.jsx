import { useEffect, useState } from 'react';
import { listSponsors } from '../api/sponsors.js';

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await listSponsors();
        if (active) setSponsors(response.data ?? []);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.error?.message || 'Unable to load sponsors.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  return (
    <main className="page-shell sponsors-page">
      <section aria-labelledby="sponsors-heading">
        <p className="eyebrow">KESARIYA Dandiya Nights</p>
        <h1 id="sponsors-heading">Our sponsors</h1>
        {loading && <p role="status">Loading sponsors…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && sponsors.length === 0 && (
          <p className="muted-copy">Sponsor information will appear here when available.</p>
        )}
        {!loading && !error && sponsors.length > 0 && (
          <div className="sponsor-grid">
            {sponsors.map((sponsor) => (
              <article className="sponsor-card" key={`${sponsor.name}-${sponsor.logo_url || 'no-logo'}`}>
                {sponsor.logo_url && <img src={sponsor.logo_url} alt={`${sponsor.name} logo`} loading="lazy" />}
                <h2>{sponsor.name}</h2>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
