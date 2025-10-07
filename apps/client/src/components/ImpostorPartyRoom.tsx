import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { auth } from '../config/firebase';
import { GAME_NAMES, type GameState } from '@phone-games/games';

interface ImpostorPartyRoomProps {
  onLeave: () => void;
}

export default function ImpostorPartyRoom({ onLeave }: ImpostorPartyRoomProps) {
  const [party, setParty] = useState<any | null>(null);
  const [gameState, setGameState] = useState<GameState<typeof GAME_NAMES.IMPOSTOR> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    loadPartyAndGameState();
    const interval = setInterval(loadPartyAndGameState, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadPartyAndGameState = async () => {
    try {
      const partyData = await api.getMyParty();
      setParty(partyData);

      // Only fetch game state if party is ACTIVE
      if (partyData.status === 'ACTIVE') {
        const gameStateData = await api.getGameState<typeof GAME_NAMES.IMPOSTOR>();
        setGameState(gameStateData);
      }

      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!party) return;
    setActionLoading(true);
    try {
      const result = await api.startMatch<typeof GAME_NAMES.IMPOSTOR>();
      setParty(result.party);
      setGameState(result.gameState);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextRound = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const result = await api.nextRound<typeof GAME_NAMES.IMPOSTOR>({ userId: currentUserId });
      console.log('Next round result:', result);
      await loadPartyAndGameState();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVote = async (votedForId: string) => {
    if (!currentUserId) return;
    setActionLoading(true);
    try {
      const votes = new Map<string, string>();
      votes.set(currentUserId, votedForId);

      const result = await api.middleRoundAction<typeof GAME_NAMES.IMPOSTOR>({ votes: Object.fromEntries(votes.entries()) });
      console.log('Vote result:', result);
      await loadPartyAndGameState();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishRound = async () => {
    setActionLoading(true);
    try {
      const result = await api.finishRound<typeof GAME_NAMES.IMPOSTOR>({});
      console.log('Finish round result:', result);
      await loadPartyAndGameState();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishMatch = async () => {
    setActionLoading(true);
    try {
      const finalState = await api.finishMatch<typeof GAME_NAMES.IMPOSTOR>();
      setGameState(finalState);
      await loadPartyAndGameState();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveParty = async () => {
    setActionLoading(true);
    try {
      await api.leaveParty();
      onLeave();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
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

  if (!party) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Party not found</p>
          <button onClick={onLeave} style={styles.button}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = party.players?.find((p: any) => p.userId === currentUserId);
  const isManager = currentPlayer?.role === 'MANAGER';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{party.partyName} - Impostor Game</h1>

        {error && <div style={styles.error}>{error}</div>}

        {/* Party Info */}
        <div style={styles.infoSection}>
          <div style={styles.infoRow}>
            <span style={styles.label}>Party ID:</span>
            <span style={{ ...styles.value, fontSize: '12px', fontFamily: 'monospace' }}>{party.id}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Status:</span>
            <span style={{
              ...styles.value,
              color: party.status === 'ACTIVE' ? '#28a745' : party.status === 'FINISHED' ? '#dc3545' : '#ffc107',
              fontWeight: 'bold',
            }}>
              {party.status}
            </span>
          </div>
          {gameState && (
            <>
              <div style={styles.infoRow}>
                <span style={styles.label}>Round:</span>
                <span style={styles.value}>{gameState.currentRound}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Game Finished:</span>
                <span style={styles.value}>{gameState.isFinished ? 'Yes' : 'No'}</span>
              </div>
            </>
          )}
        </div>

        {/* Players List */}
        <div style={styles.playersSection}>
          <h3 style={styles.sectionTitle}>Players ({party.players?.length || 0})</h3>
          <div style={styles.playersList}>
            {party.players?.map((player: any) => (
              <div key={player.id} style={styles.playerItem}>
                <span style={styles.playerName}>{player.user.username}</span>
                <span style={{
                  ...styles.playerRole,
                  backgroundColor: player.role === 'MANAGER' ? '#007bff' : '#6c757d',
                }}>
                  {player.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game State Display */}
        {gameState && party.status === 'ACTIVE' && (
          <div style={styles.gameSection}>
            <h3 style={styles.sectionTitle}>Round {gameState.currentRound}</h3>

            {/* Show word to all players */}
            {gameState.customState.currentRoundState.word && !gameState.customState.currentRoundState.roundEnded && (
              <div style={styles.wordSection}>
                <h4 style={styles.wordLabel}>Your Word:</h4>
                <div style={styles.wordDisplay}>{gameState.customState.currentRoundState.word}</div>
              </div>
            )}

            {/* Voting section - shown when round is active and not ended */}
            {!gameState.customState.currentRoundState.roundEnded && gameState.customState.currentRoundState.word && (
              <div style={styles.votingSection}>
                <h4 style={styles.sectionTitle}>Vote for the Impostor</h4>
                <div style={styles.voteButtons}>
                  {party.players?.map((player: any) => {
                    const hasVoted = Object.keys(gameState.customState.currentRoundState.votes)
                      .some((voterId) => voterId === currentUserId);
                    const isCurrentUser = player.userId === currentUserId;

                    return (
                      <button
                        key={player.userId}
                        onClick={() => handleVote(player.userId)}
                        disabled={actionLoading || hasVoted || isCurrentUser}
                        style={{
                          ...styles.voteButton,
                          opacity: isCurrentUser ? 0.5 : 1,
                          backgroundColor: hasVoted ? '#6c757d' : '#007bff',
                        }}
                      >
                        {hasVoted ? '✓ ' : ''}{player.user.username}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Round ended - show results */}
            {gameState.customState.currentRoundState.roundEnded && (() => {
              const isImpostor = gameState.customState.currentRoundState.word === 'IMPOSTOR';
              const impostorWins = gameState.customState.currentRoundState.impostorWins;
              const userWins = (isImpostor && impostorWins) || (!isImpostor && !impostorWins);

              return (
                <div style={styles.resultSection}>
                  <h4 style={styles.sectionTitle}>Round Results</h4>
                  <div style={{
                    ...styles.infoSection,
                    backgroundColor: userWins ? '#d4edda' : '#f8d7da',
                  }}>
                    <div style={styles.resultText}>
                      {impostorWins
                        ? (isImpostor ? '🎉 You Win!' : '🎭 Impostor Wins!')
                        : (isImpostor ? '😔 You Lose!' : '✅ Impostor was caught!')}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Actions */}
        <div style={styles.actionsSection}>
          {isManager && (
            <>
              {party.status === 'WAITING' && (
                <button
                  onClick={handleStartMatch}
                  style={{ ...styles.button, ...styles.startButton }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Starting...' : 'Start Match'}
                </button>
              )}
              {party.status === 'ACTIVE' && gameState && (
                <>
                  {/* Show Next Round button only if round is ended */}
                  {gameState.customState.currentRoundState.roundEnded && (
                    <button
                      onClick={handleNextRound}
                      style={{ ...styles.button, ...styles.actionButton }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Loading...' : 'Next Round'}
                    </button>
                  )}

                  {/* Show Finish Round button only if round is NOT ended */}
                  {!gameState.customState.currentRoundState.roundEnded && (
                    <button
                      onClick={handleFinishRound}
                      style={{ ...styles.button, ...styles.actionButton }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Loading...' : 'Finish Round'}
                    </button>
                  )}

                  <button
                    onClick={handleFinishMatch}
                    style={{ ...styles.button, ...styles.finishButton }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Finishing...' : 'Finish Match'}
                  </button>
                </>
              )}
            </>
          )}

          <button
            onClick={handleLeaveParty}
            style={styles.leaveButton}
            disabled={actionLoading}
          >
            {actionLoading ? 'Leaving...' : 'Leave Party'}
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
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '800px',
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
  gameSection: {
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
  actionButton: {
    backgroundColor: '#007bff',
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
  wordSection: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  wordLabel: {
    fontSize: '18px',
    color: '#856404',
    marginBottom: '10px',
  },
  wordDisplay: {
    fontSize: '32px',
    fontWeight: 'bold' as const,
    color: '#856404',
    padding: '10px',
  },
  votingSection: {
    marginBottom: '20px',
  },
  voteButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
  },
  voteButton: {
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    color: 'white',
    transition: 'opacity 0.2s',
  },
  resultSection: {
    marginBottom: '20px',
  },
  resultText: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    padding: '10px',
  },
};
