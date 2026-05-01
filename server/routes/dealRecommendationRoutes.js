import express from 'express';
import { recommendDeals } from '../controllers/dealRecommendationController.js';

const router = express.Router();

router.get('/recommended', recommendDeals);

export default router;
