import { useScrollReveal } from '../../hooks/useScrollReveal.js';

const experiences = [
  { number: '01', title: 'Live rhythm', text: 'A night shaped by movement, music and the pulse of the dance floor.' },
  { number: '02', title: 'Festival glow', text: 'Layered light, colour and motion designed to keep the atmosphere alive.' },
  { number: '03', title: 'Made together', text: 'Come with your people, meet new faces and celebrate a shared tradition.' },
];

export default function Highlights() {
  const [ref, visible] = useScrollReveal();

  return (
    <section id="highlights" ref={ref} className={`highlights-section section-shell reveal-section ${visible ? 'is-visible' : ''}`}>
      <div className="section-intro split-intro">
        <p className="section-label">02 / Experience</p>
        <div>
          <h2>More than a dance.<br /><span>A feeling.</span></h2>
          <p className="intro-copy">A contemporary celebration rooted in the warmth of Gujarati festival culture.</p>
        </div>
      </div>

      <div className="experience-list">
        {experiences.map((item) => (
          <article className="experience-row" key={item.number}>
            <span className="experience-number">{item.number}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <span className="experience-arrow">↗</span>
          </article>
        ))}
      </div>
    </section>
  );
}
