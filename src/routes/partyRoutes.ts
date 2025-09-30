import { Router } from 'express';
import { PartyController } from '../controllers/PartyController';
import { authenticateFirebase } from '../middleware/auth';

const router = Router();
const partyController = new PartyController();

// All party routes require authentication
router.use(authenticateFirebase);

// Party management routes
router.post('/', partyController.createParty);
router.get('/:id', partyController.getParty);
router.get('/', partyController.getAvailableParties);

// User-based party operations
router.post('/start', partyController.startMatch);
router.post('/join', partyController.joinParty);
router.post('/leave', partyController.leaveParty);
router.post('/promote', partyController.promoteToManager);

// Game flow routes
router.post('/game/next-round', partyController.nextRound);
router.post('/game/finish-round', partyController.finishRound);
router.post('/game/finish-match', partyController.finishMatch);
router.get('/game/state', partyController.getGameState);

export { router as partyRoutes };