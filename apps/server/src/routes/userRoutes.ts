import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateFirebase } from '../middleware/auth.js';
import { UserService } from '@phone-games/user';

export function createUserRouter(userService: UserService): Router {
    const router = Router();
    const userController = new UserController(userService);

    // Public routes
    router.post('/', userController.createUser);
    router.post('/auth/firebase', authenticateFirebase, userController.authenticateWithFirebase);

    // Protected routes
    router.get('/:id', authenticateFirebase, userController.getUserById);
    router.get('/email/:email', authenticateFirebase, userController.getUserByEmail);
    router.get('/phone/:phone', authenticateFirebase, userController.getUserByPhone);
    router.put('/:id', authenticateFirebase, userController.updateUser);
    router.delete('/:id', authenticateFirebase, userController.deleteUser);
    router.get('/', authenticateFirebase, userController.getAllUsers);

    return router;
}