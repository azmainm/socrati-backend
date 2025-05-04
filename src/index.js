import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import extractionRoutes from '../routes/extraction.routes.js';
import llmRoutes from '../routes/llm.routes.js';
import systemRoutes from '../routes/system.routes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/extraction', extractionRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/system', systemRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Socrati Backend API is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 