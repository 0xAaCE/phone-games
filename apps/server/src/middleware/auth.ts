import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { UnauthorizedError } from '../errors/index.js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  let serviceAccount = undefined;

  try {
    const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
    }
  } catch (error) {
    console.warn('Error reading service_account.json:', (error as Error).message);
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.warn('Firebase service account not configured. Only JWT tokens will work.');
  }
}

interface RequestUser {
  id: string,
  email?: string;
  name?: string;
  firebaseUid: string;
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser
}

export const firebaseVerification = async (token: string): Promise<RequestUser> => {
  if (admin.apps.length === 0) {
    throw Error("Non firebase app initiated")
  }
  const decodedToken = await admin.auth().verifyIdToken(token);

  // Use Firebase UID directly as the user ID
  return {
    id: decodedToken.uid,
    ...(decodedToken.email && { email: decodedToken.email }),
    ...(decodedToken.name && { name: decodedToken.name }),
    firebaseUid: decodedToken.uid,
  };

}

export const authenticateFirebase = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No valid authorization header provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Try to verify as Firebase token first
    try {
      req.user = await firebaseVerification(token);

      return next();
    } catch (firebaseError) {
      console.log('Firebase token verification failed, trying JWT:', (firebaseError as Error).message);
    }

    // If Firebase verification fails, try JWT
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new UnauthorizedError('JWT secret not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      req.user = decoded;

      return next();
    } catch (jwtError) {
      throw new UnauthorizedError('Invalid token provided');
    }
  } catch (error) {
    next(error);
  }
};

export const generateJWT = (user: { id: string; email?: string; name?: string; firebaseUid: string }): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign(user, jwtSecret, { expiresIn: '7d' });
};