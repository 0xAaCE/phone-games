import { Request, Response, NextFunction } from 'express';
import { UserService, CreateUserData } from '@phone-games/user';
import { AuthenticatedRequest, generateJWT } from '../middleware/auth.js';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  // POST /api/users
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserData = req.body;
      const user = await this.userService.createUser(userData);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/users/auth/firebase
  authenticateWithFirebase = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new Error('User not authenticated'));
      }

      // Check if user exists in our database by Firebase UID
      let user = await this.userService.getUserById(req.user.firebaseUid);

      // If user doesn't exist, create them with Firebase UID as the ID
      if (!user && req.user.email) {
        const userData: CreateUserData = {
          id: req.user.firebaseUid,
          username: req.user.name || req.user.email.split('@')[0],
          email: req.user.email,
        };
        user = await this.userService.createUser(userData);
      }

      if (!user) {
        return next(new Error('Failed to create or find user'));
      }

      // Generate JWT token (optional - can be removed if only using Firebase tokens)
      const token = generateJWT({
        id: user.id,
        ...(user.email && { email: user.email }),
        ...(req.user.name && { name: req.user.name }),
        firebaseUid: req.user.firebaseUid,
      });

      res.json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/:id
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/email/:email
  getUserByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.params;
      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/phone/:phone
  getUserByPhone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.params;
      const user = await this.userService.getUserByPhone(phone);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/users/:id
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userData: Partial<CreateUserData> = req.body;

      const user = await this.userService.updateUser(id, userData);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/users/:id
  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users
  getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };
}