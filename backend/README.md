# Birdalytics Backend

## Overview
Birdalytics is a backend API built with Node.js and Express, designed to support data-driven features for the Birdalytics platform.

## Tech Stack
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL (via Sequelize)
- dotenv
- CORS

## Project Structure
backend/
- config/ → database configuration
- controllers/ → request handling logic
- middleware/ → custom middleware
- models/ → Sequelize models
- routes/ → API route definitions
- index.js → application entry point

## Entry Point (index.js)
The `index.js` file initializes the Express server, loads environment variables, sets up middleware, connects to the database, registers routes, and starts the server.

## Environment Variables
Create a `.env` file with the following:
