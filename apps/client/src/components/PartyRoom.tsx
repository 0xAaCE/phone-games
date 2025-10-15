import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import ImpostorPartyRoom from './ImpostorPartyRoom.js';

interface PartyRoomProps {
  onLeave: () => void;
}

export default function PartyRoom({ onLeave }: PartyRoomProps) {
  const [party, setParty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadParty();
  }, []);

  const loadParty = async () => {
    try {
      const partyData = await api.getMyParty();
      setParty(partyData);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading party...</p>
        </div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>{error || 'Party not found'}</p>
          <button onClick={onLeave} style={styles.button}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Route to specific game party room based on game name
  if (party.gameName === 'impostor') {
    return <ImpostorPartyRoom onLeave={onLeave} />;
  }

  // Fallback for unknown games
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p>Unknown game type: {party.gameName}</p>
        <button onClick={onLeave} style={styles.button}>
          Back to Menu
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
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: '20px',
    color: '#333',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #f5c6cb',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  label: {
    fontWeight: 'bold' as const,
    color: '#555',
  },
  value: {
    color: '#333',
  },
  playersSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    marginBottom: '15px',
    color: '#333',
    fontSize: '18px',
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  playerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  playerName: {
    color: '#333',
    fontSize: '16px',
  },
  playerRole: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold' as const,
  },
  actionsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  button: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    color: 'white',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  finishButton: {
    backgroundColor: '#dc3545',
  },
  leaveButton: {
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};
