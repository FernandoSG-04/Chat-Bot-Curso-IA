# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm start` - Start the server (runs server.js)
- `npm run dev` - Start development server with nodemon
- `npm test` - Run Jest tests
- `npm run lint` - Lint JavaScript files in src/
- `npm run format` - Format code with Prettier
- `npm run security-check` - Run npm audit and fix vulnerabilities
- `npm run setup` - Install dependencies and run security check

### Testing
- Tests are configured with Jest using jsdom environment
- Test files: `**/__tests__/**/*.js` or `**/?(*.)+(spec|test).js`
- Coverage reports generated in `coverage/` directory
- Setup file: `tests/setup.js`

## Project Architecture

### Application Structure
This is a full-stack educational chatbot application with:

**Backend (server.js):**
- Express.js server with comprehensive security middleware
- JWT-based authentication with session fingerprinting
- PostgreSQL database integration for course content and user data
- OpenAI API integration for AI responses
- Rate limiting, CORS, and Helmet security headers
- File upload support with Multer

**Frontend:**
- Vanilla JavaScript (ES6+) in `src/scripts/main.js`
- Modern CSS with responsive design in `src/styles/main.css`
- Login system in `src/login/`
- Main chat interface in `src/chat.html`

### Key Components

**Chat System (`src/scripts/main.js`):**
- Chatbot configuration with OpenAI GPT-4 integration
- Real-time typing simulation and message handling
- Audio features with welcome sounds
- Conversation history and state management
- Dynamic API key loading from backend

**Security Implementation:**
- Environment variables for sensitive data (API keys, database URLs)
- JWT tokens with session fingerprinting
- API key authentication for all endpoints
- Content Security Policy and security headers
- Parameterized SQL queries to prevent injection

**Database Schema:**
- PostgreSQL with tables for course content, users, conversations, and sessions
- Content categorization by difficulty and topic
- User progress tracking and conversation history

### Configuration Files
- `jest.config.js` - Jest testing configuration with jsdom environment
- `package.json` - Dependencies and npm scripts
- Environment variables expected in `.env` file (see docs/SECURITY.md)

### Important Notes
- The application uses a security-first approach with multiple layers of protection
- Database connections and OpenAI API keys are loaded dynamically from environment variables
- Frontend does not store sensitive credentials - all API calls go through authenticated backend endpoints
- The chatbot is configured as "Asistente de Aprende y Aplica IA" (AI Learning Assistant)
- Audio features are integrated but optional for users

### Development Workflow
1. Set up environment variables (see docs/SECURITY.md for required variables)
2. Run `npm run setup` to install dependencies and check security
3. Use `npm run dev` for development with auto-restart
4. Run `npm test` to execute the test suite
5. Use `npm run lint` and `npm run format` to maintain code quality

### Documentation
- Comprehensive security documentation in `docs/SECURITY.md`
- Database structure defined in `docs/DATABASE_STRUCTURE.md`
- Setup instructions in `PROJECT_SETUP.md`
- Login implementation details in `LOGIN_IMPLEMENTATION.md`