import { Request, Response, NextFunction } from 'express';
import { updateUserInAuthService } from '../services/auth.service';

export const triggerUserUpdate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, permissions, properties } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const result = await updateUserInAuthService(userId, { permissions, properties });
    
    res.status(200).json({
      message: 'User updated successfully via M2M flow',
      result
    });
  } catch (error) {
    next(error);
  }
};
