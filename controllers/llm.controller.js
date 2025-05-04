import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { admin, db } from '../config/firebase.js';

// Load environment variables
dotenv.config();

// Mistral API key from environment variables
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Teaching style prompts
const STYLE_PROMPTS = {
  Socratic: `You are an expert in the Socratic teaching method. Create a dialogue between a Teacher and a Student that explores the concepts in the text through probing questions that lead the student to discover insights for themselves. The dialogue should follow the Socratic method where the teacher asks leading questions rather than providing direct answers. Include at least 8-10 exchanges that progressively build understanding.`,
  
  Platonic: `You are an expert in the Platonic dialogue style of teaching. Create a dialogue between a Teacher and a Student that explores the concepts in the text in a structured, explanatory manner. The teacher should guide the conversation while providing clear explanations. The dialogue should include at least 8-10 exchanges that systematically develop the subject matter.`
};

/**
 * Generate interactive reed using Mistral API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateReed = async (req, res) => {
  try {
    const { extractedText, style } = req.body;
    
    // Validate inputs
    if (!extractedText || !style) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: extractedText and style'
      });
    }
    
    if (!['Socratic', 'Platonic'].includes(style)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid style. Choose either "Socratic" or "Platonic"'
      });
    }
    
    // Define the prompt based on teaching style
    const systemPrompt = STYLE_PROMPTS[style];
    
    // Prepare prompt with text truncation if needed (Mistral has token limits)
    const userContent = extractedText.length > 5000 
      ? extractedText.substring(0, 5000) + "...(text truncated for length)"
      : extractedText;
    
    // Call Mistral API
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-medium',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    // Parse the response
    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error('Unexpected Mistral API response:', data);
      return res.status(500).json({
        success: false,
        error: 'Invalid response from LLM API'
      });
    }
    
    // Extract the generated text
    const generatedText = data.choices[0].message.content;
    
    // Return the generated text
    return res.json({
      success: true,
      generatedText,
      style
    });
  } catch (error) {
    console.error('Error generating reed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate reed'
    });
  }
}; 