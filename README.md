# MoodFlix - AI-Powered Movie Recommender

A MERN stack application that uses AI (powered by OpenAI) to recommend movies based on your mood.

## Features

- **Conversational AI**: Chat naturally about your mood and get personalized movie recommendations
- **Smart Recommendations**: AI understands context and preferences
- **Artist Search**: Find movies by your favorite actors/actresses
- **Watchlist**: Save movies to your personal watchlist (requires sign-in)
- **User Authentication**: Secure login/registration system
- **TMDB Integration**: Access to millions of movies with posters, ratings, and details

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or Atlas)
3. **OpenAI API Key**: https://platform.openai.com/api-keys
4. **TMDB API Key** (free): https://www.themoviedb.org/settings/api

## System Design

## Setup

### 1. Clone and Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Server configuration
cd server
cp .env.example .env
# Edit .env with your TMDB API key and MongoDB URI
```

### 3. Start the Application

```bash
# Terminal 1: Start the server
cd server
npm run dev

# Terminal 2: Start the client
cd client
npm run dev
```

### 4. Open the App

Navigate to http://localhost:3000 and start chatting!

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI**: OpenAI (GPT-3.5/GPT-4)
- **Movie Data**: TMDB API
- **Authentication**: JWT with HTTP-only cookies

## Project Structure

```
movie-recommender/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── App.jsx
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   └── tools/          # Agent tools
│   └── package.json
└── README.md
```

## How It Works

1. User describes their mood in natural language
2. AI agent analyzes the mood and may ask follow-up questions
3. Agent uses tools to search TMDB for relevant movies
4. Returns personalized recommendations with explanations

## Example Conversations

**User**: "I'm feeling nostalgic and want something cozy"

**AI**: "What era brings you the most nostalgia? Are you thinking 80s classics, 90s gems, or 2000s favorites?"

**User**: "90s definitely"

**AI**: "Here are some cozy 90s films perfect for your nostalgic mood..."

## Demo
