import express, { Request, Response } from 'express';
import { adminAuth } from '../middleware/adminAuth';

const adminRouter = express.Router();

// Admin route - protected, only accessible to admins
adminRouter.get('/dashboard', adminAuth, (req: Request, res: Response) => {
  res.json({ message: 'Welcome Admin! This is the admin dashboard.' });
});

// Admin route to manage users - protected, only accessible to admins
adminRouter.get('/manage-users', adminAuth, (req: Request, res: Response) => {
  res.json({ message: 'Here you can manage users' });
});

export default adminRouter;
