import { auth } from '../config/firebase.js';
import type { User, Party } from '@phone-games/db';
import type {
  ValidGameNames,
  GameState,
  NextRoundParams,
  NextRoundResult,
  MiddleRoundActionParams,
  MiddleRoundActionResult,
  FinishRoundParams,
  FinishRoundResult,
} from '@phone-games/games';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: 'Request failed' },
    }));
    throw new Error(error.error?.message || 'Request failed');
  }

  const data = await response.json();
  return data.data;
}

export const api = {
  // User endpoints
  async authenticateWithFirebase(): Promise<{ user: User; token: string }> {
    return apiRequest('/api/users/auth/firebase', {
      method: 'POST',
    });
  },

  // Party endpoints
  async createParty(partyName: string, gameName: string): Promise<Party> {
    return apiRequest('/api/parties', {
      method: 'POST',
      body: JSON.stringify({ partyName, gameName }),
    });
  },

  async joinParty(partyId: string): Promise<Party> {
    return apiRequest('/api/parties/join', {
      method: 'POST',
      body: JSON.stringify({ partyId }),
    });
  },

  async getParty(partyId: string): Promise<Party> {
    return apiRequest(`/api/parties/${partyId}`, {
      method: 'GET',
    });
  },

  async leaveParty(): Promise<void> {
    return apiRequest('/api/parties/leave', {
      method: 'POST',
    });
  },

  async getMyParty(): Promise<Party> {
    return apiRequest('/api/parties/my-party', {
      method: 'GET',
    });
  },

  async startMatch<T extends ValidGameNames>(): Promise<{ party: Party; gameState: GameState<T> }> {
    return apiRequest('/api/parties/start', {
      method: 'POST',
    });
  },

  async nextRound<T extends ValidGameNames>(params: NextRoundParams<T>): Promise<NextRoundResult<T>> {
    return apiRequest('/api/parties/game/next-round', {
      method: 'POST',
      body: JSON.stringify({ game: params }),
    });
  },

  async middleRoundAction<T extends ValidGameNames>(params: MiddleRoundActionParams<T>): Promise<MiddleRoundActionResult<T>> {
    return apiRequest('/api/parties/game/middle-round-action', {
      method: 'POST',
      body: JSON.stringify({ middleRoundActionParams: params }),
    });
  },

  async finishRound<T extends ValidGameNames>(params: FinishRoundParams<T>): Promise<FinishRoundResult<T>> {
    return apiRequest('/api/parties/game/finish-round', {
      method: 'POST',
      body: JSON.stringify({ game: params }),
    });
  },

  async finishMatch<T extends ValidGameNames>(): Promise<GameState<T>> {
    return apiRequest('/api/parties/game/finish-match', {
      method: 'POST',
    });
  },

  async getGameState<T extends ValidGameNames>(): Promise<GameState<T>> {
    return apiRequest('/api/parties/game/state', {
      method: 'GET',
    });
  },
};
