import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodObject } from 'zod';

export const validateRequest =
  (schema: ZodObject<any>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.issues,
          },
        });
      } else {
        next(error);
      }
    }
  };
