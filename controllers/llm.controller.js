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
  Socratic: `You are an expert in the Socratic teaching method. Create a dialogue between a Teacher and a Student that explores the concepts in the text through probing questions that lead the student to discover insights for themselves. The dialogue should follow the Socratic method where the teacher asks leading questions rather than providing direct answers. Include at least 8-10 exchanges that progressively build understanding. Format as plain text, alternating lines starting with 'Teacher:' or 'Student:'. Do NOT return JSON or wrap in any object.`,
  Platonic: `You are an expert in the Platonic dialogue style of teaching. Create a dialogue between a Teacher and a Student that explores the concepts in the text in a structured, explanatory manner. The teacher should guide the conversation while providing clear explanations. The dialogue should include at least 8-10 exchanges that systematically develop the subject matter. Format as plain text, alternating lines starting with 'Teacher:' or 'Student:'. Do NOT return JSON or wrap in any object.`,
  Story: `You are an expert educational storyteller. Create a dialogue between a Teacher and a Student that teaches the concepts in the text through engaging, story-driven conversation. Alternate speakers. Format as plain text, alternating lines starting with 'Teacher:' or 'Student:'. Do NOT return JSON or wrap in any object.`
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
    
    // Use the new plain text prompt
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
    
    // Return the generated text as-is (let frontend parse)
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
      // Strip Markdown code block formatting before parsing JSON
      const cleanedText = generatedText.replace(/```json\n|\n```|```/g, '').trim();
      questions = JSON.parse(cleanedText);
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      console.log('Raw LLM response:', generatedText); // Log the raw response for debugging
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