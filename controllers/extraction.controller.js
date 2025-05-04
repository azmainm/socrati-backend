import { PDFExtract } from 'pdf.js-extract';
import fs from 'fs';
import path from 'path';
import os from 'os';

const pdfExtract = new PDFExtract();

/**
 * Extract text from a PDF file
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const extractPdfText = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No PDF file uploaded' 
      });
    }

    // Check file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        success: false, 
        error: 'Uploaded file is not a PDF' 
      });
    }

    // Create a temporary file
    const tempFilePath = path.join(os.tmpdir(), `pdf-${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Extract text from PDF
    const data = await pdfExtract.extract(tempFilePath, {});
    
    // Remove the temporary file
    fs.unlinkSync(tempFilePath);

    // Extract text from each page and combine
    let extractedText = '';
    data.pages.forEach((page) => {
      // Get text content from the page
      const pageText = page.content
        .map(item => item.str)
        .join(' ');
      
      extractedText += pageText + '\n\n';
    });

    // Return the extracted text
    return res.json({
      success: true,
      data: {
        text: extractedText.trim(),
        pageCount: data.pages.length,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error processing PDF'
    });
  }
}; 