# Online Bookstore - MERN Stack Project Flow Analysis

## PROJECT OVERVIEW
This is a full-stack MERN (MongoDB, Express.js, React, Node.js) online bookstore application with Razorpay payment integration. The project consists of two main parts: a backend server and a frontend React client.

## ARCHITECTURE & TECH STACK

### Backend (Server)
- **Framework**: Express.js with Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) + bcrypt for password hashing
- **Payment Gateway**: Razorpay integration
- **Security**: Helmet, CORS, Rate limiting, MongoDB sanitization
- **Port**: 5000 (default)

### Frontend (Client)
- **Framework**: React 18
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Payment UI**: Razorpay checkout integration
- **Port**: 3000 (default)

## DATABASE MODELS

### 1. User Model (server/models/User.js)
- Fields: name, email (unique), password (hashed)
- Pre-save middleware for password hashing
- Method for password comparison
- Used for authentication

### 2. Book Model (server/models/Book.js)  
- Fields: title, author, price, description, createdAt
- Represents books available in the store

### 3. Order Model (server/models/Order.js)
- Fields: user (ref to User), items (array of book refs + qty), amount
- Fields: razorpayOrderId, razorpayPaymentId, status
- Links users to their purchases

## SERVER-SIDE FLOW

### 1. Application Setup (server/index.js)
- Loads environment variables from .env file
- Sets up Express app with middleware:
  - CORS for cross-origin requests
  - Helmet for security headers
  - Rate limiting (100 requests per 15 minutes)
  - MongoDB sanitization to prevent NoSQL injection
  - Body parser for JSON requests
- Connects to MongoDB database
- Sets up API routes
- Starts server on port 5000

### 2. Database Connection (server/config/db.js)
- Simple MongoDB connection using Mongoose
- Connects using MONGO_URI from environment variables

### 3. API Routes

#### Auth Routes (server/routes/auth.js)
- **POST /api/auth/register**: 
  - Creates new user account
  - Hashes password automatically (pre-save middleware)
  - Returns JWT token for immediate login
- **POST /api/auth/login**:
  - Validates email/password combination
  - Returns JWT token if credentials are valid

#### Books Routes (server/routes/books.js)
- **GET /api/books**: 
  - Returns all books from database
  - No authentication required (public endpoint)
- **POST /api/books/seed**:
  - Seeds database with sample book data
  - Development/testing endpoint

#### Orders Routes (server/routes/orders.js)
- **POST /api/orders/create**:
  - Creates Razorpay order
  - Saves order details in database
  - Returns orderId and amount for frontend payment
- **POST /api/orders/webhook**:
  - Handles Razorpay webhook notifications
  - Verifies payment signatures
  - Updates order status (not fully implemented)

### 4. Payment Integration (server/utils/razorpay.js)
- Initializes Razorpay instance with API credentials
- Used for creating orders and handling webhooks

## CLIENT-SIDE FLOW

### 1. Application Entry (client/src/index.js)
- React 18 entry point using createRoot
- Renders main App component

### 2. Main App Component (client/src/App.js)
- Sets up React Router with BrowserRouter
- Defines two main routes:
  - "/" -> Books page (homepage)
  - "/checkout" -> Checkout page

### 3. API Configuration (client/src/api.js)
- Configures Axios instance with base URL
- Centralized HTTP client for backend communication

### 4. Pages

#### Books Page (client/src/pages/Books.js)
- **Purpose**: Display all available books
- **Flow**:
  1. Loads on app startup (homepage)
  2. Fetches books from GET /api/books endpoint
  3. Displays books in a list with title, price
  4. Each book has a "Buy" link to checkout page
  5. Passes selected book data via React Router state

#### Checkout Page (client/src/pages/Checkout.js)
- **Purpose**: Handle book purchase and payment
- **Flow**:
  1. Receives book data from Books page via router state
  2. Shows book details and price
  3. When "Pay" button is clicked:
     - Calls POST /api/orders/create with book details
     - Receives Razorpay order ID and amount
     - Opens Razorpay payment modal
     - Handles payment success/failure

## COMPLETE USER FLOW

### 1. User Visits Homepage
- React app loads and displays Books page
- Books page fetches all books from server
- User sees list of available books with prices

### 2. Book Selection
- User clicks "Buy" on desired book
- Router navigates to /checkout with book data
- Checkout page displays book details

### 3. Payment Process
- User clicks "Pay" button
- Frontend calls server to create Razorpay order
- Server creates order in Razorpay and saves to database
- Frontend receives order details and opens payment modal
- User completes payment in Razorpay interface
- Payment success triggers alert (basic implementation)

### 4. Backend Payment Processing
- Razorpay sends webhook to server after payment
- Server verifies webhook signature
- Order status updated (webhook handler is minimal)

## ENVIRONMENT CONFIGURATION

### Server (.env file required)
- PORT=5000
- MONGO_URI=mongodb connection string
- JWT_SECRET=secret key for JWT tokens
- RAZORPAY_KEY_ID=Razorpay API key
- RAZORPAY_KEY_SECRET=Razorpay secret key
- RAZORPAY_WEBHOOK_SECRET=webhook verification secret
- FRONTEND_URL=http://localhost:3000

### Client (environment variables needed)
- REACT_APP_API_URL=http://localhost:5000/api
- REACT_APP_RAZORPAY_KEY_ID=Razorpay public key

## SECURITY FEATURES
- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- Request rate limiting
- MongoDB query sanitization
- Helmet for security headers
- Webhook signature verification

## MISSING/INCOMPLETE FEATURES
- User authentication integration in frontend
- Order history and user profile pages  
- Shopping cart functionality (currently single-item purchase)
- Complete webhook handling for payment status updates
- Error handling and validation
- Product images and detailed descriptions
- Admin panel for book management
- Inventory management
- Order status tracking

## DEVELOPMENT SETUP REQUIREMENTS
1. MongoDB database (local or cloud)
2. Razorpay account for payment processing
3. Node.js and npm installed
4. Environment variables configured
5. Dependencies installed for both client and server

## DEPLOYMENT NOTES
- Backend designed for Render deployment
- Frontend designed for Netlify deployment
- Requires proper CORS configuration for production
- Environment variables must be set in deployment platforms
- Database connection string for production MongoDB

This project provides a solid foundation for an e-commerce bookstore with room for significant enhancements and feature additions.
