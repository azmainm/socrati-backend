import express from 'express';
import { generateReed } from '../controllers/llm.controller.js';

const router = express.Router();

// Route for generating a reed from extracted text
router.post('/generate', generateReed);

// No longer need the /save route as we're handling this directly in the frontend

export default router; 