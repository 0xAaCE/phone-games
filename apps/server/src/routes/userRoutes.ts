import { type Router as RouterType } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateFirebase } from '../middleware/auth.js';

export const applyUserRoutes = (router: RouterType, userController: UserController) => {
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
}