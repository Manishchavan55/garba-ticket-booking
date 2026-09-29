export default function Hero() {
  return (
    <section id="home" className="hero section-shell">
      <div className="hero-glow hero-glow-one" />
      <div className="hero-glow hero-glow-two" />
      <div className="hero-orbit orbit-one" />
      <div className="hero-orbit orbit-two" />

      <div className="hero-copy reveal reveal-delay-1">
        <p className="kicker"><span /> Navratri 2026 <span /></p>
        <h1>Dance in the <em>rhythm.</em><br />Celebrate the <strong>night.</strong></h1>
        <p className="hero-lede">An electric Garba celebration where tradition meets a modern festival spirit.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#tickets">Book Tickets <span>→</span></a>
          <a className="text-link" href="#event">Explore the event <span>↓</span></a>
        </div>
      </div>

      <div className="hero-art" aria-hidden="true">
        <div className="mandala mandala-back" />
        <div className="mandala mandala-front">
          <span className="mandala-dot dot-a" />
          <span className="mandala-dot dot-b" />
          <span className="mandala-dot dot-c" />
          <span className="mandala-dot dot-d" />
        </div>
        <div className="dandiya dandiya-one"><i /><i /></div>
        <div className="dandiya dandiya-two"><i /><i /></div>
        <div className="spark spark-a">✦</div>
        <div className="spark spark-b">✧</div>
        <div className="spark spark-c">·</div>
        <div className="hero-badge"><span>✺</span><b>FEEL<br />THE<br />BEAT</b></div>
      </div>

      <div className="hero-meta">
        <div><span>Date</span><strong>To be announced</strong></div>
        <div><span>Venue</span><strong>To be announced</strong></div>
        <div><span>Format</span><strong>Live Garba Night</strong></div>
      </div>
    </section>
  );
}
