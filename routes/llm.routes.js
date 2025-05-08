import express from 'express';
import { generateReed, generateQuiz } from '../controllers/llm.controller.js';

const router = express.Router();

// Route for generating a reed from extracted text
router.post('/generate', generateReed);

// Quiz generation route
router.post('/generate-quiz', generateQuiz);

export default router; 