# Phone Games Server

Express.js server for the phone-games platform, handling webhooks from messaging platforms and managing game sessions.

## Overview

The server provides REST API endpoints for webhook handling and serves as the backend for the phone games platform. It coordinates between messaging services, game logic, and notifications.

## Features

- **Webhook Handling**: Process incoming messages from WhatsApp and Twilio
- **CORS Support**: Configured for client application
- **Error Handling**: Centralized error middleware
- **Logging**: Structured logging with Pino
- **Service Factory**: Centralized dependency injection
- **Docker Support**: Containerized deployment
- **Health Checks**: Readiness and liveness probes

## Architecture

```
Express Server
    ├── Webhooks (/webhook/whatsapp, /webhook/twilio)
    │       ↓
    ├── MessageHandlerService
    │       ↓
    ├── PartyManagerService (Mediator)
    │       ├── PartyService
    │       ├── GameSessionManager
    │       └── NotificationCoordinator
    └── Services (User, Notification, etc.)
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### WhatsApp Webhook
```
POST /webhook/whatsapp
```
Receives incoming messages from Meta WhatsApp Business API.

**Request Body:**
```json
{
  "entry": [
    {
      "changes": [
        {
          "field": "messages",
          "value": {
            "messages": [
              {
                "from": "1234567890",
                "text": { "body": "/create_party impostor MyParty" }
              }
            ],
            "contacts": [
              {
                "wa_id": "1234567890",
                "profile": { "name": "John Doe" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response:**
```
200 OK
```

### WhatsApp Webhook Verification
```
GET /webhook/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
```
Verifies webhook with Meta.

**Response:**
```
200 CHALLENGE
```

### Twilio Webhook
```
POST /webhook/twilio
```
Receives incoming messages from Twilio WhatsApp.

**Request Body (application/x-www-form-urlencoded):**
```
Body=/create_party impostor MyParty
From=whatsapp:+1234567890
WaId=1234567890
ProfileName=John Doe
```

**Response:**
```
200 OK
```

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/phone_games

# WhatsApp (Meta Business API)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_TOKEN=your-api-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Logging
LOG_LEVEL=info  # trace, debug, info, warn, error, fatal
```

## Running the Server

### Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Server runs on `http://localhost:3000`

### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

### Docker

```bash
# Build image
docker build -t phone-games-server .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e WHATSAPP_API_TOKEN="..." \
  phone-games-server
```

## Project Structure

```
apps/server/
├── src/
│   ├── server.ts              # Main entry point
│   ├── routes/
│   │   ├── health.ts          # Health check routes
│   │   └── webhook.ts         # Webhook routes
│   ├── middleware/
│   │   ├── errorHandler.ts    # Error handling middleware
│   │   └── requestLogger.ts   # Request logging
│   ├── factories/
│   │   └── serviceFactory.ts  # Dependency injection
│   └── config/
│       └── index.ts           # Configuration
├── Dockerfile                 # Docker configuration
└── package.json
```

## Dependency Injection

The server uses a Service Factory for dependency injection:

```typescript
// src/factories/serviceFactory.ts
import { db } from '@phone-games/db';
import { Logger } from '@phone-games/logger';
import { NotificationService } from '@phone-games/notifications';
import {
  PartyManagerService,
  PartyService,
  GameSessionManager,
  PartyNotificationCoordinator
} from '@phone-games/party';
import { MessageHandlerService } from '@phone-games/messaging';
import { UserService } from '@phone-games/user';

export function createServices(deps: ServiceFactoryDependencies): Services {
  // Create repositories
  const userRepository = new PrismaUserRepository(db);
  const partyRepository = new PrismaPartyRepository(db);

  // Create services
  const userService = new UserService(userRepository);
  const notificationService = new NotificationService(logger);

  // Create party components
  const gameStateStorage = new InMemoryGameStateStorage();
  const partyService = new PartyService(partyRepository, logger);
  const gameSessionManager = new GameSessionManager(gameStateStorage, logger);
  const partyNotificationCoordinator = new PartyNotificationCoordinator(
    notificationService,
    partyRepository,
    logger
  );

  // Create mediator
  const partyManagerService = new PartyManagerService(
    partyService,
    gameSessionManager,
    partyNotificationCoordinator,
    logger
  );

  // Create message handler
  const parsers = [new WhatsAppParser(), new TwilioParser()];
  const messageHandlerService = new MessageHandlerService(
    notificationService,
    partyManagerService,
    userService,
    parsers,
    logger
  );

  return {
    userService,
    partyManagerService,
    messageHandlerService
  };
}
```

## Error Handling

Centralized error handling middleware:

```typescript
// src/middleware/errorHandler.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Request error', error, {
    method: req.method,
    path: req.path,
    body: req.body
  });

  if (error instanceof BaseError) {
    return res.status(error.statusCode || 500).json({
      error: error.name,
      message: error.message,
      metadata: error.metadata
    });
  }

  // Unknown error
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred'
  });
}
```

## Logging

Structured logging with request correlation:

```typescript
// src/middleware/requestLogger.ts
export function requestLogger(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    const requestLogger = logger.child({ requestId });

    requestLogger.info('Request received', {
      method: req.method,
      path: req.path,
      query: req.query
    });

    res.on('finish', () => {
      requestLogger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: Date.now() - startTime
      });
    });

    next();
  };
}
```

## Webhook Verification

### WhatsApp Webhook Verification

Meta requires webhook verification:

```typescript
// Verification endpoint
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});
```

### Twilio Webhook Validation

Twilio signs requests with X-Twilio-Signature:

```typescript
import { validateRequest } from 'twilio';

app.post('/webhook/twilio', (req, res) => {
  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  if (!validateRequest(TWILIO_AUTH_TOKEN, signature, url, req.body)) {
    return res.status(403).send('Forbidden');
  }

  // Process webhook...
});
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  server:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/phone_games
      WHATSAPP_API_TOKEN: ${WHATSAPP_API_TOKEN}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: phone_games
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: phone-games-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: phone-games-server
  template:
    metadata:
      labels:
        app: phone-games-server
    spec:
      containers:
      - name: server
        image: phone-games-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: phone-games-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Monitoring

### Health Checks

```typescript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});
```

### Metrics

Consider adding metrics with Prometheus:

```typescript
import promClient from 'prom-client';

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Expose metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

## Security

### CORS

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/webhook', limiter);
```

### Helmet

```typescript
import helmet from 'helmet';

app.use(helmet());
```

## Dependencies

- `express`: Web framework
- `@phone-games/*`: All platform packages
- `pino`: Logger
- `prisma`: Database ORM
- `cors`: CORS middleware
- `dotenv`: Environment variables
- `twilio`: Twilio SDK (webhook validation)

## Related Apps

- `@phone-games/client`: Frontend web application
