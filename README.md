# Socrati Backend

A Node.js Express backend service for the Socrati interactive educational platform. This service provides APIs for PDF extraction and AI dialogue generation used by the Socrati frontend.

## Features

- **PDF Text Extraction**: Extract text content from PDF files using pdf.js-extract
- **LLM Integration**: Connect to Mistral AI for generating interactive educational dialogues
- **RESTful API Design**: Clean API architecture for frontend consumption
- **Firebase Integration**: Secure integration with Firebase for authentication and data storage
- **CORS Support**: Cross-Origin Resource Sharing enabled for frontend integration
- **Memory-efficient File Handling**: Process files in memory without requiring disk storage

## API Endpoints

### PDF Extraction
- `POST /api/extraction/pdf`: Extract text from a PDF file
  - Request: Multipart form with `file` field containing the PDF
  - Response: JSON with extracted text and metadata

### LLM Dialogue Generation
- `POST /api/llm/generate`: Generate interactive dialogues from extracted text
  - Request: JSON with `extractedText` and `style` fields
  - Response: JSON with generated dialogue content
  - Supports multiple teaching styles: Socratic and Platonic

## Tech Stack

- **Framework**: Express.js
- **Runtime**: Node.js
- **PDF Processing**: pdf.js-extract
- **File Handling**: Multer for in-memory file processing
- **AI Integration**: Mistral AI API
- **Authentication**: Firebase Admin SDK
- **Database**: Firestore (via Firebase Admin)
- **Environment**: dotenv for configuration

## Project Structure

```
socrati-backend/
├── config/                # Configuration files
│   └── firebase.js       # Firebase initialization
├── controllers/           # Request handlers
│   ├── extraction.controller.js  # PDF extraction logic
│   └── llm.controller.js         # LLM dialogue generation
├── middleware/            # Express middleware
│   └── auth.middleware.js # Authentication middleware (optional)
├── routes/                # API route definitions
│   ├── extraction.routes.js      # PDF extraction routes
│   └── llm.routes.js             # LLM dialogue generation routes
├── src/                   # Application source code
│   └── index.js           # Express app entry point
├── .env                   # Environment variables (create this file)
└── package.json           # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Firebase project with authentication set up
- Firebase Admin SDK service account
- Mistral AI API key

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Set up Firestore database
3. Generate a private key for your service account:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="your-private-key-with-quotes"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Mistral AI API
MISTRAL_API_KEY=your_mistral_api_key
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/socrati-backend.git
   cd socrati-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. The server will start on http://localhost:5000

## API Usage Examples

### Extract Text from PDF

```bash
curl -X POST http://localhost:5000/api/extraction/pdf \
  -F "file=@/path/to/your/document.pdf"
```

### Generate Dialogue

```bash
curl -X POST http://localhost:5000/api/llm/generate \
  -H "Content-Type: application/json" \
  -d '{
    "extractedText": "Your extracted text content here...",
    "style": "Socratic"
  }'
```

## Development Workflow

- Add proper JSDoc documentation to all functions
- Implement appropriate error handling
- Use async/await pattern for asynchronous operations
- Follow RESTful API design principles
- Test API endpoints with tools like Postman or curl

## Securing Your API

For production deployments, consider:

1. Implementing rate limiting
2. Adding request validation
3. Using Firebase Authentication tokens for secure endpoints
4. Setting up HTTPS
5. Implementing proper CORS policies

## Deployment

This application can be deployed to various platforms:

- **Heroku**: Use the Heroku CLI or GitHub integration
- **Google Cloud Run**: Containerize with Docker and deploy to Cloud Run
- **AWS Lambda**: Use serverless framework for Lambda deployment
- **Digital Ocean**: Deploy as an App Platform service

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid input or missing parameters
- `401 Unauthorized`: Authentication failure
- `413 Payload Too Large`: File size exceeds limit (10MB for PDFs)
- `500 Internal Server Error`: Server-side error

## License

This project is licensed under the MIT License - see the LICENSE file for details.