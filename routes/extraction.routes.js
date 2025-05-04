import express from 'express';
import multer from 'multer';
import { extractPdfText } from '../controllers/extraction.controller.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Route for PDF text extraction
router.post('/pdf', upload.single('file'), extractPdfText);

export default router; 