# PII Scanner

A comprehensive multi-language PII detection system with 3-stage sequential execution.

## Project Overview

This application provides progressive PII detection with three stages:
1. **Basic Search** - Rule-based pattern matching (✅ Implemented)
2. **Deep Search** - NER and preprocessing (⏳ Pending)
3. **Context Search** - Context validation (⏳ Pending)

## Architecture

```
pii-detector/
├── frontend/          # React TypeScript application with Tailwind CSS
├── backend/           # Express TypeScript server
├── engines/           # PII detection engines
│   ├── stage1/        # Rule-based engine (✅ Complete)
│   ├── stage2/        # Deep search engine (⏳ Pending)
│   ├── stage3/        # Context search engine (⏳ Pending)
│   ├── patterns/      # Language-specific patterns (✅ Complete)
│   └── utils/         # Shared utilities (✅ Complete)
├── tests/            # Test suites (⏳ Pending)
├── docs/             # Documentation (⏳ Pending)
└── docker/           # Container configurations (⏳ Pending)
```

## Supported Languages

- 🇰🇷 Korean (한국어)
- 🇺🇸 English
- 🇨🇳 Chinese (中文)
- 🇯🇵 Japanese (日本語)
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)

## Features Implemented

### Stage 1: Rule-Based Detection ✅
- Regex pattern matching for all supported languages
- Phone number detection (mobile & landline)
- Email address detection
- ID number detection (SSN, DNI, etc.)
- Name detection with titles/honorifics
- Address detection
- Credit card validation with Luhn check
- Postal code detection

### Frontend Components ✅
- Language selector with multi-select
- Text input with character limit validation
- Progress indicator showing 3-stage workflow
- Search controls with sequential button activation
- Results visualization
- Error handling and user feedback

### Backend API ✅
- `/api/search/basic` - Stage 1 rule-based search
- `/api/patterns/:language` - Language pattern retrieval
- `/api/health` - Health check endpoint
- Input validation and sanitization
- Rate limiting (30 requests/minute)
- Security headers and CORS

## Quick Start

### Prerequisites
- Node.js 16+
- npm 8+

### Installation

1. Clone the repository
2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Development

Start both servers in development mode:
```bash
npm run dev
```

Or start individually:

Backend (http://localhost:3001):
```bash
cd backend
npm run dev
```

Frontend (http://localhost:3000):
```bash
cd frontend
npm start
```

### API Usage

**Basic Search:**
```bash
curl -X POST http://localhost:3001/api/search/basic \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact John Doe at 010-1234-5678 or john@example.com",
    "languages": ["english", "korean"]
  }'
```

**Get Patterns:**
```bash
curl http://localhost:3001/api/patterns/korean
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Detection**: Custom regex engines, validation algorithms
- **Security**: Helmet, CORS, rate limiting
- **Development**: Nodemon, concurrently

## Performance Metrics

- Stage 1 response time: <500ms
- Memory usage: <2GB per instance
- Concurrent users: 50+
- Text limit: 10,000 characters

## Current Status

### ✅ Completed (Phase 1)
- Project structure and setup
- Stage 1 rule-based detection engine
- All language patterns (6 languages)
- Frontend UI components
- Backend API infrastructure
- Input validation and security

### ⏳ Pending Implementation
- Stage 2: Deep Search with NER
- Stage 3: Context Search with validation
- Result highlighting visualization
- Docker containerization
- Comprehensive testing
- Performance optimization

## API Endpoints

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| POST | `/api/search/basic` | ✅ | Stage 1 rule-based search |
| POST | `/api/search/deep` | ⏳ | Stage 2 deep search |
| POST | `/api/search/context` | ⏳ | Stage 3 context search |
| GET | `/api/patterns` | ✅ | Get all patterns summary |
| GET | `/api/patterns/:lang` | ✅ | Get language-specific patterns |
| GET | `/api/health` | ✅ | Health check |

## Contributing

This is currently in active development. The foundation is complete with Stage 1 working end-to-end.

## Security

- No server-side data storage
- Input sanitization and validation
- Rate limiting protection
- HTTPS enforcement ready
- Security headers via Helmet

## License

MIT License