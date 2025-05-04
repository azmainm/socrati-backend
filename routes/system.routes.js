import express from 'express';

const router = express.Router();

/**
 * Wake up endpoint to prevent render.com from putting the server to sleep
 * This endpoint returns a 200 OK status with minimal data
 */
router.get('/wake-up', (req, res) => {
  res.status(200).json({ status: 'awake', timestamp: Date.now() });
});

export default router;
