import { useEffect, useState } from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import Hero from './components/Hero/Hero.jsx';
import EventInfo from './components/EventInfo/EventInfo.jsx';
import Highlights from './components/Highlights/Highlights.jsx';
import TicketCards from './components/TicketCards/TicketCards.jsx';
import Footer from './components/Footer/Footer.jsx';
import { getHealth } from './services/api.js';
import './styles.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    let active = true;

    getHealth()
      .then(() => active && setBackendStatus('online'))
      .catch(() => active && setBackendStatus('offline'));

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <Hero />
        <EventInfo backendStatus={backendStatus} />
        <Highlights />
        <TicketCards />
      </main>
      <Footer />
    </div>
  );
}

export default App;
