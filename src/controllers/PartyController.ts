import { Request, Response, NextFunction } from 'express';
import { PartyManagerService } from '../services/PartyManagerService';
import { Game } from '../interfaces/Game';
import { db } from '@db';
import { AuthenticatedRequest } from '../middleware/auth';
import { ValidationError } from '../errors';

export class PartyController {
  private partyService: PartyManagerService;

  constructor() {
    this.partyService = new PartyManagerService(db);
  }

  // POST /api/parties
  createParty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new ValidationError('User ID required');
      }

      const { partyName, game } = req.body;

      if (!partyName || !game) {
        throw new ValidationError('Party name and game are required');
      }

      // Note: In a real implementation, you'd get the game instance from a registry
      // For now, we'll assume the game object is passed in the request
      const party = await this.partyService.createParty(req.user.id, partyName, game);

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
      const party = await this.partyService.getParty(id);

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
      const parties = await this.partyService.getAvailableParties(gameName as string);

      res.json({
        success: true,
        data: parties,
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

      const { game } = req.body;

      if (!game) {
        throw new ValidationError('Game instance required');
      }

      const result = await this.partyService.startMatch(req.user.id, game);

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

      const partyPlayer = await this.partyService.joinParty(req.user.id, partyId);

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

      await this.partyService.leaveParty(req.user.id);

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

      const partyPlayer = await this.partyService.promoteToManager(req.user.id, targetUserId);

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

      const gameState = await this.partyService.nextRound(req.user.id, game);

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

      const gameState = await this.partyService.finishRound(req.user.id, game);

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

      const { game } = req.body;

      if (!game) {
        throw new ValidationError('Game instance required');
      }

      const gameState = await this.partyService.finishMatch(req.user.id, game);

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

      const gameState = await this.partyService.getGameState(req.user.id);

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