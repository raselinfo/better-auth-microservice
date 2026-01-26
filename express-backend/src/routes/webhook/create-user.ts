import { Router, Response } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { AuthenticatedRequest } from '../../types/express';
import { updateUserInAuthService } from '../../services/auth.service';

const router = Router();

router.post(
  "/create-user",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    const { userId, properties} = req.body;
    
    console.log("Hit create-user webhook", userId, properties);
    
        if (!userId) {
          res.status(400).json({ 
            error: 'userId is required',
            receivedBody: req.body,
            headers: req.headers
          });
          return;
        }
    
        const result = await updateUserInAuthService(userId, {  properties });
    res.json({
      success: true,
      message: 'Example controller working',
      data: {
        timestamp: new Date().toISOString(),
      result

      },
    });
  })
);

export default router