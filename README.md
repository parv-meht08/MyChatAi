# MyChatAI 🤖

A powerful web-based development environment with AI integration for collaborative coding and project management.

## Features ✨

- **User Authentication** 🔐
  - Secure login and registration system
  - Cookie-based session management
  - Protected routes and user authorization

- **Project Management** 📁
  - Create and manage coding projects
  - Real-time code execution
  - Project organization and storage

- **AI Integration** 🧠
  - AI-powered code assistance
  - Smart code suggestions
  - Intelligent project analysis

## Tech Stack 🛠️

- **Frontend** 💻
  - React.js
  - WebContainer API
  - Axios for API calls
  - Modern UI/UX design

- **Backend** ⚙️
  - Node.js with Express
  - MongoDB Database
  - JWT Authentication
  - CORS enabled

## API Routes 🛣️

### User Routes
- `POST /users/register` - Register new user
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile
- `PUT /users/update` - Update user details

### Project Routes
- `POST /projects/create` - Create new project
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get specific project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### AI Routes
- `POST /ai/assist` - Get AI assistance
- `POST /ai/analyze` - Analyze code

## Setup Instructions 🚀

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd Backend
   npm install

   # Frontend
   cd Frontend
   npm install
   ```

3. **Environment Setup**
   - Create `.env` file in Backend directory
   - Required environment variables:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `FRONTEND_URL`

4. **Run the Application**
   ```bash
   # Backend
   cd Backend
   npm start

   # Frontend
   cd Frontend
   npm run dev
   ```

## Security Features 🔒

- CORS Protection
- Content Security Policy
- Secure Cookie Management
- Cross-Origin Resource Policy

## Contributing 🤝

Feel free to contribute to this project by creating issues or submitting pull requests.

## License 📄

This project is licensed under the MIT License.
