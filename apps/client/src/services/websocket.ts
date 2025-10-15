import { GameState, ValidGameNames } from '@phone-games/games';
import { auth } from '../config/firebase.js';
import { ValidActions, ValidGameActions, ValidPartyActions } from '@phone-games/notifications';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

export type WebSocketMessage = {
  type: 'notification';
  payload: {
    title: string;
    body: string;
    action: ValidActions;
    data: GameState<ValidGameNames>;
  };
};

export type WebSocketNotification<T extends ValidGameNames> = {
  type: 'PARTY_UPDATE' | 'GAME_STATE_UPDATE' | 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'ROUND_UPDATE';
  data: GameState<T>;
  action: ValidActions;
  title?: string;
  body?: string;
};

type WebSocketListener = (notification: WebSocketNotification<ValidGameNames>) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<WebSocketListener> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const token = await this.getAuthToken();
      this.isIntentionallyClosed = false;

      // Connect with token in query params (browser WebSocket doesn't support custom headers)
      this.ws = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(token)}`);

      this.ws.addEventListener('open', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      });

      this.ws.addEventListener('message', (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          if (message.type === 'notification') {
            // Convert server notification format to client notification format
            const notification = this.parseNotification(message.payload);

            // Notify all listeners
            this.listeners.forEach(listener => listener(notification));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      this.ws.addEventListener('close', (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.ws = null;

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
      });

      this.ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  subscribe(listener: WebSocketListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private parseNotification(payload: WebSocketMessage['payload']): WebSocketNotification<ValidGameNames> {
    const action = payload.action;

    // Map server notification actions to client notification types
    switch (action) {
      case ValidGameActions.START_MATCH:
        return {
          type: 'GAME_STATE_UPDATE',
          data: payload.data,
          action: payload.action,
          title: payload.title,
          body: payload.body,
        };
      case ValidGameActions.NEXT_ROUND:
        return {
          type: 'ROUND_UPDATE',
          data: payload.data,
          action: payload.action,
          title: payload.title,
          body: payload.body,
        };
      case ValidGameActions.MIDDLE_ROUND_ACTION:
        return {
          type: 'GAME_STATE_UPDATE',
          data: payload.data,
          action: payload.action,
          title: payload.title,
          body: payload.body,
        };
      case ValidGameActions.FINISH_ROUND:
        return {
          type: 'ROUND_UPDATE',
          data: payload.data,
          action: payload.action,
          title: payload.title,
          body: payload.body,
        };
      case ValidGameActions.FINISH_MATCH:
        return {
          type: 'GAME_STATE_UPDATE',
          data: payload.data,
          action: payload.action,
          title: payload.title,
          body: payload.body,
        };
      case ValidPartyActions.PLAYER_JOINED:
        return {
          type: 'PARTY_UPDATE',
          data: payload.data,
          action: payload.action,
        };
      case ValidPartyActions.PLAYER_LEFT:
        return {
          type: 'PARTY_UPDATE',
          data: payload.data,
          action: payload.action,
        };
      default:
        console.warn('Unknown notification action:', action);
        return {
          type: 'GAME_STATE_UPDATE',
          data: payload.data,
          action: payload.action,
          title: payload.title,
          body: payload.body,
        };
    }
  }

  private async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
