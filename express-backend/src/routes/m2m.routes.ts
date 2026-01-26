import { Router } from 'express';
import { triggerUserUpdate } from '../controllers/m2m.controller';

const router = Router();

// Route to trigger the M2M update (for testing/demonstration)
router.post('/update-user', triggerUserUpdate);

export default router;
