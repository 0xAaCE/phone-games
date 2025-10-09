import { Server } from 'http';
import { VerifyClientCallbackAsync, WebSocket, WebSocketServer } from 'ws';
import { NotificationService, WebSocketNotificationProvider } from '@phone-games/notifications';
import { AuthenticatedRequest, firebaseVerification } from '../middleware/auth';
import { UnauthorizedError } from '../errors';

type VerifyClientInfo = Parameters<VerifyClientCallbackAsync>[0]
type VerifyClientCallback = Parameters<VerifyClientCallbackAsync>[1]

export class WebSocketManager {
    private wss: WebSocketServer;
    private notificationService: NotificationService;

    public constructor(server: Server, notificationService: NotificationService) {
        this.wss = new WebSocketServer({ server, path: '/ws', verifyClient: this.verifyClient.bind(this)});
        this.notificationService = notificationService;
        this.setupWebSocket();
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws: WebSocket, request: AuthenticatedRequest) => {
            if (!request.user?.id) {
                return
            }
            const wsProvider = new WebSocketNotificationProvider(ws);
            this.notificationService.registerUser(request.user?.id, wsProvider);
        });
    }

    private async verifyClient(info: VerifyClientInfo, callback: VerifyClientCallback){
        const authHeader = info.req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No valid authorization header provided');
        }
      
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            (info.req as AuthenticatedRequest).user = await firebaseVerification(token);
            callback(true)

        } catch (error) {
            console.error(error);
            callback(false, 401, 'Invalid token')
        }
    }


}