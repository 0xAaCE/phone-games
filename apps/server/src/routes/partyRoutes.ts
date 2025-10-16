import { Router } from 'express';
import { PartyController } from '../controllers/partyController.js';
import { authenticateFirebase } from '../middleware/auth.js';
import { PartyManagerService } from '@phone-games/party';

export function createPartyRouter(partyService: PartyManagerService): Router {
    const router = Router();
    const partyController = new PartyController(partyService);

    // All party routes require authentication
    router.use(authenticateFirebase);

    // Party management routes
    router.post('/', partyController.createParty);
    router.get('/my-party', partyController.getMyParty);
    router.get('/:id', partyController.getParty);
    router.get('/', partyController.getAvailableParties);

    // User-based party operations
    router.post('/start', partyController.startMatch);
    router.post('/join', partyController.joinParty);
    router.post('/leave', partyController.leaveParty);
    router.post('/promote', partyController.promoteToManager);

    // Game flow routes
    router.post('/game/next-round', partyController.nextRound);
    router.post('/game/middle-round-action', partyController.middleRoundAction);
    router.post('/game/finish-round', partyController.finishRound);
    router.post('/game/finish-match', partyController.finishMatch);
    router.get('/game/state', partyController.getGameState);

    return router;
}