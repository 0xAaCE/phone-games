import { Server } from 'http';
import { VerifyClientCallbackAsync, WebSocket, WebSocketServer } from 'ws';
import { NotificationService, WebSocketNotificationProvider } from '@phone-games/notifications';
import { AuthenticatedRequest, firebaseVerification } from '../middleware/auth.js';
import { ILogger } from '@phone-games/logger';

type VerifyClientInfo = Parameters<VerifyClientCallbackAsync>[0]
type VerifyClientCallback = Parameters<VerifyClientCallbackAsync>[1]

export class WebSocketManager {
    private wss: WebSocketServer;
    private notificationService: NotificationService;
    private logger: ILogger;

    public constructor(server: Server, notificationService: NotificationService, logger: ILogger) {
        this.wss = new WebSocketServer({ server, path: '/ws', verifyClient: this.verifyClient.bind(this)});
        this.notificationService = notificationService;
        this.logger = logger.child({ service: 'WebSocketManager' });
        this.setupWebSocket();
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws: WebSocket, request: AuthenticatedRequest) => {
            if (!request.user?.id) {
                this.logger.warn('WebSocket connection attempt without user ID');
                return
            }
            const wsProvider = new WebSocketNotificationProvider(ws, this.logger);
            this.notificationService.registerUser(request.user?.id, wsProvider);
            this.logger.info('WebSocket connection established', { userId: request.user.id });
        });

        this.wss.on('error', (error) => {
            this.logger.error('WebSocket error', error);
        });

        this.wss.on('close', (request: AuthenticatedRequest) => {
            if (!request.user?.id) {
                return
            }

            this.notificationService.unregisterUser(request.user?.id);
            this.logger.info('WebSocket connection closed', { userId: request.user.id });
        });
    }

    private async verifyClient(info: VerifyClientInfo, callback: VerifyClientCallback){
        // Try to get token from Authorization header first
        let token = info.req.headers.authorization?.replace('Bearer ', '');

        // If not in header, check query params (for browser WebSocket clients)
        if (!token && info.req.url) {
            const url = new URL(info.req.url, `http://${info.req.headers.host}`);
            token = url.searchParams.get('token') || undefined;
        }

        if (!token) {
            callback(false, 401, 'No token provided');
            return;
        }

        try {
            (info.req as AuthenticatedRequest).user = await firebaseVerification(token);
            callback(true);
        } catch (error) {
            this.logger.warn('WebSocket authentication failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            callback(false, 401, 'Invalid token');
        }
    }

    closeAllConnections() {
        this.wss.clients.forEach((client) => {
            client.close();
        });

        this.wss.close();
    }


}