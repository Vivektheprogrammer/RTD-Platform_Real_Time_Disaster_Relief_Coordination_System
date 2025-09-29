# Real-Time Disaster Relief Coordination Platform

A comprehensive platform for coordinating disaster relief efforts in real-time, connecting victims, NGOs, and government agencies.

## Features

- **User Registration & Authentication**: Role-based registration for victims, NGOs, and government agencies
- **Real-time Updates**: Instant notifications and updates about disaster situations
- **Resource Management**: Track and manage available resources for disaster relief
- **Geolocation Integration**: Map-based visualization of victims and resources
- **Verification System**: Government agencies can verify NGOs

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT Authentication
- Socket.IO for real-time communication

### Frontend
- React.js
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests
- Leaflet for maps and geolocation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Vivektheprogrammer/RTD-Platform_Real_Time_Disaster_Relief_Coordination_System.git
   cd rtd-platform
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Configure environment variables
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/rtd-platform
     JWT_SECRET=your_jwt_secret
     CLIENT_URL=http://localhost:3000
     ```

4. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server
   ```bash
   cd frontend
   npm start
   ```

3. Access the application at `http://localhost:3000`

## Project Structure

```
rtd-platform/
├── backend/
│   ├── middleware/     # Authentication middleware
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── .env            # Environment variables
│   ├── package.json    # Backend dependencies
│   └── server.js       # Express server setup
└── frontend/
    ├── public/         # Static files
    ├── src/
    │   ├── components/ # Reusable components
    │   ├── contexts/   # React contexts
    │   ├── layouts/    # Page layouts
    │   ├── pages/      # Page components
    │   ├── App.js      # Main component
    │   └── index.js    # Entry point
    ├── package.json    # Frontend dependencies
    └── tailwind.config.js # Tailwind CSS configuration
```

## Acknowledgments

- This platform is designed to help coordinate disaster relief efforts more efficiently
- Inspired by the need for better communication during emergency situations