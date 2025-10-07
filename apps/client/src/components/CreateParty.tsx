import { useState } from 'react';
import { api } from '../services/api';
import { GAME_NAMES } from '@phone-games/games';

interface CreatePartyProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function CreateParty({ onBack, onSuccess }: CreatePartyProps) {
  const [gameName, setGameName] = useState<string>(GAME_NAMES.IMPOSTOR);
  const [partyName, setPartyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateParty = async () => {
    if (!partyName.trim()) {
      setError('Please enter a party name');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.createParty(partyName, gameName);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Party</h1>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.form}>
          <label style={styles.label}>Party Name:</label>
          <input
            type="text"
            placeholder="Enter party name"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Select Game:</label>
          <select
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            style={styles.select}
          >
            {Object.values(GAME_NAMES).map((game) => (
              <option key={game} value={game}>
                {game.charAt(0).toUpperCase() + game.slice(1)}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateParty}
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Party'}
          </button>

          <button onClick={onBack} style={styles.backButton}>
            Back
          </button>
        </div>
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
    marginBottom: '30px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  label: {
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: '5px',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    marginBottom: '10px',
  },
  select: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    marginBottom: '10px',
  },
  button: {
    padding: '12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
  },
  backButton: {
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    border: '1px solid #f5c6cb',
  },
  partyInfo: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  partyId: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#007bff',
    margin: '10px 0',
    wordBreak: 'break-all' as const,
  },
  hint: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px',
  },
  gameInfo: {
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  gameName: {
    fontSize: '18px',
    color: '#333',
    textTransform: 'capitalize' as const,
  },
};
