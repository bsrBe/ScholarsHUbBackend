const express = require("express");
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
require("dotenv").config({ path: "./config/.env" });
const { errorHandler } = require("./utils/errorResponse");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/db");
const YAML = require("yamljs");
const userFormRoutes = require('./routes/userFormRoutes');
const partnersContactRoutes = require('./routes/partnersContactRoutes');
const articleRoutes = require("./routes/articleRoutes");
const faqRoutes = require("./routes/faqRoutes");
const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const jitsiRoutes = require("./routes/jitsiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const taskApplicationRoutes = require("./routes/taskApplicationRoutes");
const chatRoutes = require('./routes/chatRoutes');
const { setupHealthEndpoint, scheduleKeepAlive } = require('./cron-keep-alive');

const allowedOrigins = [
  "https://scholarshubglobal.com",
  "https://www.scholarshubglobal.com",
  "http://scholarshubglobal.com",
  "http://www.scholarshubglobal.com",
  "http://localhost:8080",
  "https://meet.jit.si",
  "https://*.jit.si",
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowedOrigins
    const isAllowed = allowedOrigins.indexOf(origin) !== -1;
    if (isAllowed) return callback(null, true);

    // If not in allowedOrigins, check if it's a localhost origin trying to bypass via snapshot bot
    const isLocalhost = origin.startsWith('http://localhost:');
    return callback(null, isLocalhost); // We will check the UA in a custom middleware to reject if not bot
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'User-Agent'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
};

// Custom CORS check middleware for Snapshot Bot
const snapshotBotCheck = (req, res, next) => {
  const origin = req.headers.origin;
  const ua = req.headers['user-agent'];
  
  if (origin && origin.startsWith('http://localhost:')) {
    // Allow the Snapshot Bot
    if (ua && ua.includes("ScholarsHubSnapshotBot/1.0")) {
      return next();
    }
    
    // Allow standard browsers for local development
    const isBrowser = ua && (
      ua.includes("Mozilla") || 
      ua.includes("Chrome") || 
      ua.includes("Safari") || 
      ua.includes("Edge")
    );
    
    if (isBrowser) {
      return next();
    }

    // Block other unauthorized automated attempts on localhost
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Unauthorized localhost access attempt.'
    });
  }
  next();
};

// Apply middlewares
app.use(cors(corsOptions));
app.use(snapshotBotCheck);

// Enable pre-flight across the board
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger documentation
const swaggerDocument = YAML.load("./swagger.yaml");
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      withCredentials: true, // Make sure cookies are sent with requests
      persistAuthorization: true // Persist authorization between page refreshes
    },
  })
);

app.use(cookieParser());
app.use(express.json());

// Set up health check endpoint (must be before routes/middleware that might mask it)
setupHealthEndpoint(app);

app.use("/api/auth", authRoutes);
app.use("/api/forms", userFormRoutes);
app.use("/api/partners-contact", partnersContactRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/faqs", faqRoutes)
app.use("/api/meetings", meetingRoutes);
app.use("/api/jitsi", jitsiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/task-applications", taskApplicationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/duolingo", require("./routes/duolingoRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));

// Error handler middleware (must be after all other middleware and routes)
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('ScholarHub API is running');
});

// Handle 404 - Keep this as the last route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      // Start the keep-alive scheduler after the server starts
      scheduleKeepAlive();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error(`Error: ${err.message}`);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
