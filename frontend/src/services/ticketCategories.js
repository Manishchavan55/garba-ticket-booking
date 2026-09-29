export const ticketCategories = [
  {
    id: 'single',
    name: 'Single',
    subtitle: 'One entry for one celebration',
    priceLabel: 'Price announced soon',
    perks: ['1 event entry', 'Digital ticket', 'Festival access'],
    featured: false,
  },
  {
    id: 'couple',
    name: 'Couple',
    subtitle: 'A shared night of rhythm and colour',
    priceLabel: 'Price announced soon',
    perks: ['2 event entries', 'Digital tickets', 'Festival access'],
    featured: true,
  },
  {
    id: 'group',
    name: 'Group',
    subtitle: 'Bring your circle to the dance floor',
    priceLabel: 'Price announced soon',
    perks: ['Group entry', 'Digital tickets', 'Festival access'],
    featured: false,
  },
];

// Temporary UI-only data. Replace this export with GET /api/ticket-categories
// when the backend ticket-category module is available.
