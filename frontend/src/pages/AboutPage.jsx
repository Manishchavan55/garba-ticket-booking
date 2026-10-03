import { Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';

export default function AboutPage() {
  return (
    <PublicLayout>
      <main className="public-content about-page">
        <p className="eyebrow">About Kesariya</p>
        <h1>Tradition with a modern pulse.</h1>
        <p className="about-lead">Kesariya Garba Nights brings together music, dance, food and community for memorable Navratri celebrations.</p>
        <div className="about-grid">
          <article><span>♫</span><h2>Rhythm</h2><p>Live DJs and orchestras keep the floor moving from the first beat to the last circle.</p></article>
          <article><span>✣</span><h2>Culture</h2><p>Traditional Garba energy meets a contemporary event experience built for every generation.</p></article>
          <article><span>♥</span><h2>Togetherness</h2><p>Family-friendly venues, clear ticketing and thoughtful event operations keep the night welcoming.</p></article>
        </div>
        <Link className="button" to="/events">Explore Events →</Link>
      </main>
    </PublicLayout>
  );
}
