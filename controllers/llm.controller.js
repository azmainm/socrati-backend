import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { admin, db } from '../config/firebase.js';

// Load environment variables
dotenv.config();

// Mistral API key from environment variables
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';

// Style-specific prompts
const STYLE_PROMPTS = {
  Socratic: `You are a wise Socratic teacher. Your job is to create a dialogue that teaches the core concepts from the text provided by the user. Use the Socratic method: ask thought-provoking questions that lead the student to discover insights themselves rather than just telling them information. Create a balanced dialogue where the teacher asks 60% of the time and explains 40%. Keep each response concise (1-3 sentences). The dialogue should have 10-15 exchanges, with the teacher speaking first. Format as JSON: {"dialogues":[{"speaker":"teacher", "text":"..."}, {"speaker":"student", "text":"..."}, ...]}. Speaker should alternate between "teacher" and "student" only. The dialogue should follow a clear progression from basic to advanced understanding.`,
  
  Platonic: `You are a Platonic dialogue creator. Your job is to craft a dialogue in the style of Plato's works that teaches the core concepts from the text provided by the user. Create a balanced conversation between two characters: a wise guide and a curious learner. The guide should use analogies, examples and gentle questioning to lead the learner to understanding. Keep each response concise (2-4 sentences). The dialogue should have 10-15 exchanges, with the guide speaking first. Format as JSON: {"dialogues":[{"speaker":"teacher", "text":"..."}, {"speaker":"student", "text":"..."}, ...]}. Speaker should alternate between "teacher" and "student" only. The dialogue should have a clear narrative arc, beginning with foundational concepts and building to deeper insights.`,
  
  Story: `You are an educational story creator. Your job is to craft an engaging story that teaches the core concepts from the text provided by the user. Create a narrative with two main characters: a mentor and a protagonist who's learning. The mentor should help the protagonist understand key lessons through their journey together. Keep each exchange relatively brief but vivid. The story should have 10-15 exchanges, with the mentor speaking first. Format as JSON: {"dialogues":[{"speaker":"teacher", "text":"..."}, {"speaker":"student", "text":"..."}, ...]}. Speaker should alternate between "teacher" and "student" only. The story should have a clear beginning, middle, and resolution, with the protagonist demonstrating growth in understanding.`
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
    
    if (!['Socratic', 'Platonic', 'Story'].includes(style)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid style. Choose either "Socratic", "Platonic", or "Story"'
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

/**
 * Generate quiz questions from dialogue text
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateQuiz = async (req, res) => {
  try {
    const { dialogueText } = req.body;

    if (!dialogueText) {
      return res.status(400).json({
        success: false,
        error: 'Dialogue text is required'
      });
    }

    // Create a prompt for the LLM to generate quiz questions
    const systemPrompt = `You are a quiz generator. Your job is to create multiple choice questions based on the provided dialogue. Each question should test understanding of the main concepts discussed.`;

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
            content: `Based on the following dialogue, create 5 multiple choice quiz questions that test understanding of the main concepts. Each question should have 4 options and one correct answer. Format the response as a JSON array of objects with 'question', 'options' (array of 4 strings), and 'correctAnswer' (string) fields.

Dialogue:
${dialogueText}

Format the response as a JSON array of 5 question objects.`
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

    // Extract and parse the generated text
    const generatedText = data.choices[0].message.content;
    let questions;
    try {
      questions = JSON.parse(generatedText);
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse quiz questions from LLM response'
      });
    }

    // Validate the questions format
    if (!Array.isArray(questions) || questions.length !== 5) {
      return res.status(500).json({
        success: false,
        error: 'Invalid quiz questions format from LLM'
      });
    }

    // Validate each question
    for (const question of questions) {
      if (!question.question || !Array.isArray(question.options) || question.options.length !== 4 || !question.correctAnswer) {
        return res.status(500).json({
          success: false,
          error: 'Invalid question format in LLM response'
        });
      }
    }

    return res.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate quiz questions'
    });
  }
}; 