# Online Bookstore — Full Stack MERN Application

A comprehensive, production-ready Online Bookstore application built with the MERN stack, featuring complete order management, secure user authentication, payment integration, and comprehensive administrative controls.

## 🚀 Quick Demo Access

**Demo Credentials (Works Offline):**
- **Username:** `demo`
- **Password:** `demo123`

🎯 **Special Demo Features:**
- Works even when backend server is offline
- Instantly redirects to Books page upon login
- Perfect for showcasing the application
- No database or server setup required for demo

## ✨ Features Overview

### 🛒 Customer Experience
- **Book Discovery:** Browse curated book collections with detailed information and search functionality
- **Smart Authentication:** Secure login with email or username, featuring client-side demo mode
- **Shopping Cart:** Intuitive cart management with quantity controls
- **Secure Payments:** Razorpay integration with multiple payment methods
- **Order Tracking:** Complete order lifecycle management with status updates
- **Return Management:** Request returns and cancellations with tracking
- **Profile Management:** Update personal information and change passwords
- **Order History:** Detailed order history with pagination and filtering

### 🔧 Administrative Dashboard
- **Order Management:** Complete admin interface for processing and tracking orders
- **Status Control:** Update order statuses (Pending → Processing → Shipped → Delivered)
- **Refund Processing:** Handle customer refunds and cancellations
- **Analytics Dashboard:** Comprehensive order statistics and business metrics
- **User Management:** Admin controls for user accounts and permissions
- **Inventory Control:** Real-time stock management with order integration
- **Book Management:** Add, edit, and manage book catalog
- **Category Management:** Organize books with hierarchical categories

### � API Documentation

### Authentication Endpoints
```bash
POST /api/auth/register        # User registration
POST /api/auth/login          # User login (email/username)
POST /api/auth/logout         # User logout
GET  /api/auth/profile        # Get user profile
PUT  /api/auth/profile        # Update user profile
```

### Book Management
```bash
GET    /api/books             # Get all books (with filtering)
GET    /api/books/:id         # Get specific book details
POST   /api/books             # Add new book (admin only)
PUT    /api/books/:id         # Update book (admin only)
DELETE /api/books/:id         # Delete book (admin only)
```

### Order Management
```bash
# Customer Orders
GET    /api/orders/history    # Get user's order history
POST   /api/orders            # Create new order
PUT    /api/orders/:id/cancel # Cancel order
POST   /api/orders/:id/return # Return order

# Admin Order Management
GET    /api/admin/orders      # Get all orders (admin)
PUT    /api/admin/orders/:id  # Update order status (admin)
POST   /api/admin/orders/:id/refund # Process refund (admin)
```

### Payment Processing
```bash
POST   /api/payment/create-order    # Create Razorpay order
POST   /api/payment/verify          # Verify payment
```

### Admin Dashboard
```bash
GET    /api/admin/dashboard/stats   # Get analytics data
GET    /api/admin/dashboard/orders  # Order analytics
GET    /api/admin/dashboard/revenue # Revenue analytics
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT Token-based Authentication** with secure cookie storage
- **Password Hashing** using bcrypt with 12 salt rounds
- **Protected Routes** for authenticated users only
- **Admin Role-based Access Control** for administrative functions
- **Rate Limiting** to prevent brute force attacks

### Data Security
- **Input Validation & Sanitization** using express-validator
- **NoSQL Injection Protection** with mongo-sanitize
- **XSS Protection** with helmet.js
- **CORS Configuration** for cross-origin request security
- **Secure Headers** implementation

### Payment Security
- **Razorpay Integration** with signature verification
- **Secure Payment Processing** with webhook validation
- **PCI DSS Compliance** through Razorpay's secure gateway

## 🎨 Design & User Experience

### Frontend Architecture
- **React 18** with latest hooks and concurrent features
- **Context API** for global state management
- **React Router v6** for modern routing
- **Responsive Design** with CSS Grid and Flexbox
- **Component-based Architecture** for reusability

### UI/UX Features
- **Smart Navigation** with authentication-aware routing
- **Loading States** for better user feedback
- **Error Handling** with user-friendly messages
- **Modal Systems** for interactive confirmations
- **Progressive Enhancement** with offline demo mode

## 🚀 Performance Optimizations

### Frontend Performance
- **Code Splitting** for optimized bundle sizes
- **Lazy Loading** for route-based components
- **React.memo** for component optimization
- **Efficient Re-rendering** with proper dependencies

### Backend Performance
- **Database Indexing** for faster query performance
- **Middleware Optimization** for request processing
- **Connection Pooling** for database efficiency
- **Caching Headers** for static asset optimization

## 🧪 Testing & Quality Assurance

### Code Quality
- **ESLint Configuration** for code consistency
- **Proper Error Boundaries** for React error handling
- **Type Safety** through proper PropTypes usage
- **Security Auditing** with npm audit

### Best Practices
- **RESTful API Design** with proper HTTP methods
- **Separation of Concerns** in component architecture
- **Environment Configuration** for different deployment stages
- **Git Workflow** with meaningful commit messages

## 🔧 Development Commands

### Backend Development
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run test       # Run backend tests
npm run lint       # Run ESLint checks
npm audit          # Security vulnerability check
```

### Frontend Development
```bash
npm start          # Start development server
npm run build      # Create production build
npm run test       # Run React tests
npm run eject      # Eject from Create React App (one-way)
npm run analyze    # Analyze bundle size
```

## 📦 Deployment Guide

### Production Deployment
1. **Environment Setup**
   - Set NODE_ENV=production
   - Configure production database URL
   - Set secure JWT secrets
   - Configure production payment gateway

2. **Build Process**
   ```bash
   cd OnlineBookstore_client
   npm run build
   ```

3. **Server Configuration**
   - Set up reverse proxy (nginx/Apache)
   - Configure SSL certificates
   - Set up process manager (PM2)
   - Configure environment variables

### Docker Deployment (Optional)
```dockerfile
# Example Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing Guidelines

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- Follow existing code style and patterns
- Add appropriate comments for complex logic
- Update documentation for new features
- Test all changes thoroughly
- Ensure responsive design compliance

## 📄 License & Support

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Support & Issues
- 🐛 **Bug Reports:** Open an issue with detailed description
- 💡 **Feature Requests:** Discuss in GitHub Discussions
- 📧 **Direct Support:** Contact the development team
- 📚 **Documentation:** Check the wiki for detailed guides

### Acknowledgments
- React.js community for excellent documentation
- Express.js team for robust backend framework
- MongoDB team for reliable database solutions
- Razorpay for secure payment processing
- All contributors who helped shape this project

---

**Happy Coding! 🚀** Built with ❤️ for the developer community.

## 🛠 Technology Stack

### Backend Infrastructure
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework with middleware support
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for stateless authentication
- **bcrypt** - Advanced password hashing and validation
- **Razorpay SDK** - Payment gateway integration

### Frontend Architecture
- **React 18** - Modern React with functional components and hooks
- **React Router v6** - Client-side routing with protected routes
- **Context API** - Global state management for authentication
- **Axios** - HTTP client with interceptors for API communication
- **Modern CSS3** - Responsive design with gradient backgrounds and animations

### Security & DevOps
- **Helmet.js** - Security headers middleware
- **express-rate-limit** - API rate limiting and DDoS protection
- **express-mongo-sanitize** - MongoDB injection prevention
- **CORS** - Cross-Origin Resource Sharing configuration
- **dotenv** - Environment variable management

## 📁 Project Architecture

```
online_bookstore/
├── OnlineBookstore_client/          # React Frontend Application
│   ├── public/
│   │   ├── index.html              # Main HTML template
│   │   └── favicon.ico             # Application icon
│   ├── src/
│   │   ├── components/             # Reusable React Components
│   │   │   ├── Header.js           # Navigation header with auth state
│   │   │   ├── HomePage.js         # Smart routing homepage
│   │   │   ├── ProtectedRoute.js   # Route protection component
│   │   │   └── admin/              # Admin-specific components
│   │   ├── pages/                  # Main Page Components
│   │   │   ├── Books.js            # Book catalog and browsing
│   │   │   ├── Login.js            # Authentication with demo mode
│   │   │   ├── Register.js         # User registration
│   │   │   ├── Profile.js          # User profile management
│   │   │   ├── OrderHistory.js     # Customer order tracking
│   │   │   └── Checkout.js         # Payment processing
│   │   ├── contexts/               # React Context Providers
│   │   │   └── AuthContext.js      # Global authentication state
│   │   ├── services/               # API Communication Layer
│   │   │   └── adminAPI.js         # Admin-specific API calls
│   │   ├── styles/                 # CSS Stylesheets
│   │   │   ├── Auth.css            # Authentication pages styling
│   │   │   └── Header.css          # Navigation styling
│   │   ├── api.js                  # Main API configuration
│   │   ├── App.js                  # Root application component
│   │   └── index.js                # React application entry point
│   ├── package.json                # Frontend dependencies
│   └── README.txt                  # Client-specific documentation
│
└── OnlineBookstore_server/          # Node.js/Express Backend
    ├── models/                      # MongoDB Data Models
    │   ├── User.js                  # User authentication & profiles
    │   ├── Book.js                  # Book catalog management
    │   ├── Order.js                 # Order processing & tracking
    │   └── Category.js              # Book categorization
    ├── routes/                      # API Route Handlers
    │   ├── auth.js                  # Authentication endpoints
    │   ├── books.js                 # Book management APIs
    │   ├── orders.js                # Customer order APIs
    │   └── admin/                   # Administrative Routes
    │       ├── dashboard.js         # Analytics & reporting
    │       ├── books.js             # Admin book management
    │       ├── orders.js            # Admin order processing
    │       └── categories.js        # Category management
    ├── middleware/                  # Custom Middleware
    │   └── adminAuth.js            # Admin authentication
    ├── config/                      # Configuration Files
    │   └── db.js                   # Database connection
    ├── utils/                       # Utility Functions
    │   └── razorpay.js             # Payment processing
    ├── index.js                     # Server entry point
    ├── package.json                 # Backend dependencies
    └── .env.example                 # Environment variables template
```

## 🚦 Quick Start Guide

### Prerequisites
- **Node.js** (v16 or higher recommended)
- **MongoDB** (local installation or MongoDB Atlas cloud)
- **Git** for repository cloning
- **Razorpay Account** (for payment processing)

### 🔧 Installation Steps

#### 1. Repository Setup
```bash
git clone https://github.com/your-username/online_bookstore.git
cd online_bookstore
```

#### 2. Backend Configuration
```bash
cd OnlineBookstore_server
npm install
```

**Environment Configuration:**
Create `.env` file in the server directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/bookstore
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/bookstore

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=7200000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Start Backend Server:**
```bash
npm start
# OR for development with auto-restart:
npm run dev
```

#### 3. Frontend Configuration
```bash
cd ../OnlineBookstore_client
npm install
```

**Environment Configuration:**
Create `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

**Start Frontend Application:**
```bash
npm start
```

#### 4. Application Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Demo Login:** Use `demo` / `demo123` credentials

### 🎯 Quick Demo (No Setup Required)
1. Open the frontend application
2. Use demo credentials: `demo` / `demo123`
3. Explore the Books page and features
4. Demo mode works even without backend setup!

## 🔐 Authentication System

The application features a robust authentication system with:

- **User Registration:** Create new accounts with email verification
- **Flexible Login:** Login with email or username
- **Demo Account:** Pre-configured demo user for testing
- **Password Security:** bcrypt hashing with salt rounds
- **Account Protection:** Login attempt limiting and temporary lockouts
- **JWT Tokens:** Secure token-based session management

## 📦 Order Management System

### Customer Order Flow
1. Browse and select books
2. Add items to shopping cart
3. Proceed to secure checkout
4. Complete payment via Razorpay
5. Receive order confirmation
6. Track order status and shipment
7. Manage returns and cancellations

### Admin Order Management
- Process incoming orders
- Update order status at each stage
- Handle cancellations and refunds
- View comprehensive order analytics
- Manage inventory levels

## 💳 Payment Integration

- **Razorpay Gateway:** Secure payment processing
- **Multiple Payment Methods:** Credit/Debit cards, UPI, Net Banking
- **Webhook Verification:** Automatic payment status updates
- **Refund Processing:** Automated refund handling for cancellations

## 🔒 Security Features

- **Input Validation:** Comprehensive server-side validation
- **SQL Injection Protection:** MongoDB sanitization
- **Rate Limiting:** API endpoint protection
- **CORS Configuration:** Secure cross-origin requests
- **Security Headers:** Helmet.js implementation
- **Password Policies:** Strong password requirements

## 🚀 Deployment

### Backend Deployment (Render)
1. Connect repository to Render
2. Configure environment variables
3. Deploy with automatic builds

### Frontend Deployment (Netlify)
1. Build the React application
2. Deploy to Netlify with CI/CD
3. Configure environment variables for API endpoints

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (email or username)
- `POST /api/auth/create-demo-user` - Create demo user account

### Order Management Endpoints
- `GET /api/orders` - Get user orders (with pagination)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:id/tracking` - Get order tracking info

### Admin Endpoints
- `GET /api/admin/orders` - Get all orders (admin)
- `PUT /api/admin/orders/:id/status` - Update order status
- `PUT /api/admin/orders/:id/refund` - Process refund
- `GET /api/admin/orders/stats/dashboard` - Order analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or support, please open an issue in the repository or contact the development team.
