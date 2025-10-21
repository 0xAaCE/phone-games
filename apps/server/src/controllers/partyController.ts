import { Request, Response, NextFunction } from 'express';
import { SessionCoordinator } from '@phone-games/party';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '@phone-games/errors';
import { GameFactory, ValidGamesSchema } from '@phone-games/games';

export class PartyController {
  private sessionCoordinator: SessionCoordinator;

  constructor(sessionCoordinator: SessionCoordinator) {
    this.sessionCoordinator = sessionCoordinator;
  }

  // POST /api/parties
  createParty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const { partyName, gameName } = req.body;

      if (!partyName || !gameName) {
        throw new ValidationError('Party name and game are required');
      }

      if (!ValidGamesSchema.safeParse(gameName).success) {
        throw new ValidationError('Valid Game name required');
      }

      const game = GameFactory.createGame(gameName);
      const party = await this.sessionCoordinator.createParty(req.user.id, partyName, game);

      res.status(201).json({
        success: true,
        data: party,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/parties/:id
  getParty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const party = await this.sessionCoordinator.getParty(id);

      if (!party) {
        res.status(404).json({
          success: false,
          error: 'Party not found',
        });
        return;
      }

      res.json({
        success: true,
        data: party,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/parties
  getAvailableParties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { gameName } = req.query;
      const parties = await this.sessionCoordinator.getAvailableParties(gameName as string);

      res.json({
        success: true,
        data: parties,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/parties/my-party
  getMyParty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const party = await this.sessionCoordinator.getMyParty(req.user.id);

      if (!party) {
        res.status(404).json({
          success: false,
          error: 'No active party found',
        });
        return;
      }

      res.json({
        success: true,
        data: party,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/start
  startMatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const result = await this.sessionCoordinator.startMatch(req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/join
  joinParty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const { partyId } = req.body;

      if (!partyId) {
        throw new ValidationError('Party ID required');
      }

      const partyPlayer = await this.sessionCoordinator.joinParty(req.user.id, partyId);

      res.json({
        success: true,
        data: partyPlayer,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/leave
  leaveParty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      await this.sessionCoordinator.leaveParty(req.user.id);

      res.json({
        success: true,
        message: 'Left party successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/promote
  promoteToManager = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const { targetUserId } = req.body;

      if (!targetUserId) {
        throw new ValidationError('Target user ID required');
      }

      const partyPlayer = await this.sessionCoordinator.promoteToManager(req.user.id, targetUserId);

      res.json({
        success: true,
        data: partyPlayer,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/game/next-round
  nextRound = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const { game } = req.body;

      if (!game) {
        throw new ValidationError('Game instance required');
      }

      const gameState = await this.sessionCoordinator.nextRound(req.user.id, game);

      res.json({
        success: true,
        data: gameState,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/game/middle-round-action
  middleRoundAction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const { middleRoundActionParams } = req.body;

      const gameState = await this.sessionCoordinator.middleRoundAction(req.user.id, middleRoundActionParams);

      res.json({
        success: true,
        data: gameState,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/game/finish-round
  finishRound = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const { game } = req.body;

      if (!game) {
        throw new ValidationError('Game instance required');
      }

      const gameState = await this.sessionCoordinator.finishRound(req.user.id, game);

      res.json({
        success: true,
        data: gameState,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/parties/game/finish-match
  finishMatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const gameState = await this.sessionCoordinator.finishMatch(req.user.id);

      res.json({
        success: true,
        data: gameState,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/parties/game/state
  getGameState = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const gameState = await this.sessionCoordinator.getGameState(req.user.id);

      if (!gameState) {
        res.status(404).json({
          success: false,
          error: 'No active game found',
        });
        return;
      }

      res.json({
        success: true,
        data: gameState,
      });
    } catch (error) {
      next(error);
    }
  };
}