# Phone Games Client

React + TypeScript frontend application for the phone-games platform.

## Overview

Web-based client application built with React, TypeScript, and Vite. Provides a user interface for managing game sessions, viewing game state, and monitoring parties in real-time.

## Tech Stack

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Firebase**: Authentication and real-time database (optional)

## Features

- Modern React with hooks
- TypeScript for type safety
- Hot Module Replacement (HMR) with Vite
- Fast builds and optimized bundles
- ESLint for code quality

## Project Structure

```
apps/client/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API and service layer
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
├── public/                   # Static assets
├── index.html                # HTML entry point
├── vite.config.ts            # Vite configuration
└── tsconfig.json             # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# From monorepo root
pnpm install
```

### Development

```bash
# Start development server
pnpm --filter @phone-games/client dev
```

Application runs on `http://localhost:5173`

### Build

```bash
# Build for production
pnpm --filter @phone-games/client build

# Preview production build
pnpm --filter @phone-games/client preview
```

## Environment Variables

Create `.env` file in `apps/client`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Firebase Configuration (if using)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Development

### Component Structure

```typescript
// src/components/PartyCard.tsx
import { FC } from 'react';

interface PartyCardProps {
  partyId: string;
  partyName: string;
  players: string[];
  onJoin: (partyId: string) => void;
}

export const PartyCard: FC<PartyCardProps> = ({
  partyId,
  partyName,
  players,
  onJoin
}) => {
  return (
    <div className="party-card">
      <h3>{partyName}</h3>
      <p>Players: {players.length}</p>
      <button onClick={() => onJoin(partyId)}>
        Join Party
      </button>
    </div>
  );
};
```

### Custom Hooks

```typescript
// src/hooks/useParty.ts
import { useState, useEffect } from 'react';
import type { Party } from '@phone-games/db';

export function useParty(partyId: string) {
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchParty() {
      try {
        const response = await fetch(`/api/parties/${partyId}`);
        const data = await response.json();
        setParty(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchParty();
  }, [partyId]);

  return { party, loading, error };
}
```

### API Service

```typescript
// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiService {
  static async getParty(partyId: string): Promise<Party> {
    const response = await fetch(`${API_URL}/api/parties/${partyId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch party');
    }
    return response.json();
  }

  static async createParty(data: CreatePartyData): Promise<Party> {
    const response = await fetch(`${API_URL}/api/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to create party');
    }
    return response.json();
  }
}
```

## Shared Types

The client can import types from packages:

```typescript
import type { User, Party } from '@phone-games/db';
import type { GameState, ImpostorCustomState } from '@phone-games/games';
import type { Notification } from '@phone-games/notifications';

// Use types in components
interface GameViewProps {
  gameState: GameState<'impostor'>;
  onVote: (targetId: string) => void;
}
```

## WebSocket Integration

Real-time updates via WebSocket:

```typescript
// src/services/websocket.ts
export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(userId: string) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    this.ws = new WebSocket(`${wsUrl}?userId=${userId}`);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.notifyListeners(message.type, message.data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => this.connect(userId), 5000);
    };
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: (data: any) => void) {
    this.listeners.get(eventType)?.delete(callback);
  }

  private notifyListeners(eventType: string, data: any) {
    this.listeners.get(eventType)?.forEach(callback => callback(data));
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
```

### Using WebSocket in Components

```typescript
// src/components/GameView.tsx
import { useEffect, useState } from 'react';
import { WebSocketService } from '../services/websocket';

export function GameView({ gameId }: { gameId: string }) {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const ws = new WebSocketService();
    ws.connect(gameId);

    ws.on('game_state_update', (data) => {
      setGameState(data);
    });

    ws.on('player_eliminated', (data) => {
      console.log('Player eliminated:', data.playerId);
    });

    return () => {
      ws.disconnect();
    };
  }, [gameId]);

  return (
    <div>
      <h2>Game View</h2>
      {gameState && <GameState state={gameState} />}
    </div>
  );
}
```

## Styling

### CSS Modules

```typescript
// src/components/Button.module.css
.button {
  padding: 10px 20px;
  border-radius: 4px;
  background: #007bff;
  color: white;
  border: none;
  cursor: pointer;
}

.button:hover {
  background: #0056b3;
}

// src/components/Button.tsx
import styles from './Button.module.css';

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
}
```

## Testing

```bash
# Run tests (if configured)
pnpm --filter @phone-games/client test

# Run linter
pnpm --filter @phone-games/client lint

# Fix linting issues
pnpm --filter @phone-games/client lint:fix

# Type check
pnpm --filter @phone-games/client typecheck
```

## Build & Deployment

### Production Build

```bash
pnpm --filter @phone-games/client build
```

Output in `apps/client/dist/`

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-*.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @phone-games/client build

FROM nginx:alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Static Hosting

Deploy to Vercel, Netlify, or Cloudflare Pages:

```bash
# Build command
pnpm --filter @phone-games/client build

# Output directory
apps/client/dist
```

## Performance

### Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const GameView = lazy(() => import('./components/GameView'));
const PartyList = lazy(() => import('./components/PartyList'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/game/:id" element={<GameView />} />
        <Route path="/parties" element={<PartyList />} />
      </Routes>
    </Suspense>
  );
}
```

### Bundle Analysis

```bash
# Install bundle analyzer
pnpm add -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

# Build to see bundle analysis
pnpm build
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'game-logic': ['@phone-games/games'],
          'notifications': ['@phone-games/notifications']
        }
      }
    }
  }
});
```

## Environment-Specific Builds

```bash
# Development
VITE_API_URL=http://localhost:3000 pnpm dev

# Staging
VITE_API_URL=https://staging-api.example.com pnpm build

# Production
VITE_API_URL=https://api.example.com pnpm build
```

## Dependencies

- `react`: UI library
- `react-dom`: React DOM renderer
- `@phone-games/games`: Game logic and types
- `@phone-games/db`: Database types
- `@phone-games/notifications`: Notification types
- `firebase`: Authentication and real-time features
- `vite`: Build tool
- `typescript`: Type checking

## Related Apps

- `@phone-games/server`: Backend API server
