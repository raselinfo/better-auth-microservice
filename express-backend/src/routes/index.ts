import { Router } from 'express';
import exampleRoutes from './example.routes';
import m2mRoutes from './m2m.routes';
import webhookRoutes from './webhook/create-user';
const router = Router();

// Mount routes
router.use('/example', exampleRoutes);
router.use('/m2m', m2mRoutes);
router.use('/webhook', webhookRoutes);
export default router;
