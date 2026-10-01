const formatPrice = (price) => {
  const value = Number(price);
  if (!Number.isFinite(value)) return 'Price unavailable';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

export default function TicketCategoryCard({ category }) {
  const available = category.availability_status === 'available';

  return (
    <article className="ticket-card">
      <div>
        <p className="ticket-card__label">Ticket category</p>
        <h3>{category.name}</h3>
      </div>
      <p className="ticket-card__price">{formatPrice(category.price)}</p>
      <p className={`availability availability--${available ? 'available' : 'unavailable'}`}>
        {available ? 'Available' : 'Currently unavailable'}
      </p>
    </article>
  );
}
