import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
});

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking backend...');

  useEffect(() => {
    api.get('/api/health')
      .then((response) => {
        setBackendStatus(response.data.status + ' — ' + response.data.service);
      })
      .catch(() => setBackendStatus('Backend unavailable'));
  }, []);

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Garba Ticket Booking</p>
        <h1>Project setup complete</h1>
        <p>Module 1 establishes the Spring Boot API and React frontend.</p>
        <div className="status">
          <span>Backend:</span>
          <strong>{backendStatus}</strong>
        </div>
      </section>
    </main>
  );
}

export default App;
