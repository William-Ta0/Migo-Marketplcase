# MERN Stack Item Manager Application

A simple web application for managing items using the MERN stack (MongoDB, Express, React, Node.js).

## Project Structure

- `backend/`: Node.js and Express server
- `frontend/`: React frontend application

## Features

- Create, read, update, and delete items
- Mark items as completed
- RESTful API

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or Atlas)
- npm (v6+ recommended)

### Installation

1. Clone the repository

2. Install backend dependencies

```
cd backend
npm install
```

3. Install frontend dependencies

```
cd frontend
npm install
```

4. Set up your environment variables
   Edit the `.env` file in the backend directory to configure your MongoDB connection string and other settings.

### Running the application

#### Backend

```
cd backend
npm run dev
```

#### Frontend

```
cd frontend
npm start
```

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:5555.

## API Endpoints

- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get an item by ID
- `POST /api/items` - Create a new item
- `PUT /api/items/:id` - Update an item
- `DELETE /api/items/:id` - Delete an item

## Technology Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose ODM
