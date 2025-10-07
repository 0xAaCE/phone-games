import { useState } from 'react';
import { api } from '../services/api';

interface JoinPartyProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function JoinParty({ onBack, onSuccess }: JoinPartyProps) {
  const [partyId, setPartyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinParty = async () => {
    if (!partyId.trim()) {
      setError('Please enter a party ID');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.joinParty(partyId);
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
        <h1 style={styles.title}>Join Party</h1>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.form}>
          <label style={styles.label}>Party ID:</label>
          <input
            type="text"
            placeholder="Enter party ID"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            style={styles.input}
          />

          <button
            onClick={handleJoinParty}
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Party'}
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
  },
  button: {
    padding: '12px',
    backgroundColor: '#007bff',
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
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#007bff',
    margin: '10px 0',
    wordBreak: 'break-all' as const,
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
  statusInfo: {
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  statusActive: {
    fontSize: '16px',
    color: '#28a745',
    fontWeight: 'bold' as const,
  },
  statusInactive: {
    fontSize: '16px',
    color: '#dc3545',
    fontWeight: 'bold' as const,
  },
};
