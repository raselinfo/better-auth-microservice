import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { asyncHandler } from '../middlewares/asyncHandler';

export const getExample = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Example controller working',
    data: {
      timestamp: new Date().toISOString(),
      user: req.user || null,
    },
  });
});

export const createExample = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, value } = req.body;

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    data: {
      id: Math.random().toString(36).substr(2, 9),
      name,
      value,
      createdAt: new Date().toISOString(),
    },
  });
});
