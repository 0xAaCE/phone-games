import { useState } from 'react';
import { auth } from '../config/firebase.js';
import CreateParty from './CreateParty.js';
import JoinParty from './JoinParty.js';
import PartyRoom from './PartyRoom.js';

export default function Home() {
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'party'>('menu');

  const handleSignOut = async () => {
    await auth.signOut();
  };

  if (view === 'create') {
    return <CreateParty onBack={() => setView('menu')} onSuccess={() => setView('party')} />;
  }

  if (view === 'join') {
    return <JoinParty onBack={() => setView('menu')} onSuccess={() => setView('party')} />;
  }

  if (view === 'party') {
    return <PartyRoom onLeave={() => setView('menu')} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Phone Games</h1>
        <p style={styles.welcomeText}>
          Welcome, {auth.currentUser?.displayName || auth.currentUser?.email}!
        </p>

        <div style={styles.buttonContainer}>
          <button
            onClick={() => setView('create')}
            style={{ ...styles.button, ...styles.createButton }}
          >
            Create Party
          </button>
          <button
            onClick={() => setView('join')}
            style={{ ...styles.button, ...styles.joinButton }}
          >
            Join Party
          </button>
        </div>

        <button onClick={handleSignOut} style={styles.signOutButton}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '10px',
    color: '#333',
  },
  welcomeText: {
    textAlign: 'center' as const,
    marginBottom: '30px',
    color: '#666',
    fontSize: '16px',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    marginBottom: '20px',
  },
  button: {
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    color: 'white',
  },
  createButton: {
    backgroundColor: '#28a745',
  },
  joinButton: {
    backgroundColor: '#007bff',
  },
  signOutButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#666',
  },
};
