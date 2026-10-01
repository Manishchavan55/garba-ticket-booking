export default function StatusMessage({ title, message, tone = 'neutral' }) {
  return (
    <section className={`status-message status-message--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
