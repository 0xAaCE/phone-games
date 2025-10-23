import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { UnauthorizedError, InternalServerError } from '@phone-games/errors';

// Simple logger for initialization (before main logger is available)
const initLogger = {
  warn: (message: string, context?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    process.stderr.write(`[${timestamp}] WARN: ${message}${contextStr}\n`);
  }
};

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  let serviceAccount = undefined;

  try {
    const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
    } else {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        // Replace escaped newlines with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }
    }
  } catch (error) {
    initLogger.warn('Error reading service_account.json', { error: (error as Error).message });
  }

  if (serviceAccount && serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    initLogger.warn('Firebase service account not configured. Only JWT tokens will work.');
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
      // Firebase verification failed, will try JWT next
      // Silent fallback - only log at debug level if logger available
    }

    // If Firebase verification fails, try JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new UnauthorizedError('JWT secret not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as RequestUser;
    req.user = decoded;

    return next();
  } catch (error) {
    next(error);
  }
};

export const generateJWT = (user: { id: string; email?: string; name?: string; firebaseUid: string }): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new InternalServerError('JWT secret not configured');
  }

  return jwt.sign(user, jwtSecret, { expiresIn: '7d' });
};