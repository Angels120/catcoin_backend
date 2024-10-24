import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET_KEY || ''; // Store in env variables

// Middleware to check if the user is an admin
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  // Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required for admin access' });
  }

  jwt.verify(token, secretKey, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    // Check if the user has the admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next(); // User is an admin, proceed to the route
  });
};
