const express = require("express");
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
const taskApplicationRoutes = require("./routes/taskApplicationRoutes");
const { setupHealthEndpoint, scheduleKeepAlive } = require('./cron-keep-alive');
require("dotenv").config({ path: "./config/.env" });

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173", 
  "http://localhost:3000",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  'http://localhost:8081',  
 "https://nondeluded-decennially-zola.ngrok-free.dev",
 "https://scholarshub1.vercel.app",
  'http://192.168.1.192:8080',
  "http://127.0.0.1:5173",
  "https://meet.jit.si",
  "https://*.jit.si",
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

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

app.use("/api/auth", authRoutes);
app.use("/api/forms", userFormRoutes);
app.use("/api/partners-contact", partnersContactRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/faqs", faqRoutes)
app.use("/api/meetings", meetingRoutes);
app.use("/api/jitsi", jitsiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/task-applications", taskApplicationRoutes);


app.get('/', (req, res) => {
  res.send('Hello World');
});

// Setup health check endpoint for keep-alive
setupHealthEndpoint(app);

connectDB();

app.listen(5000, '0.0.0.0', () => {
  console.log("server listenning on Port", process.env.PORT || 5000);
  
  // Start keep-alive cron job
  scheduleKeepAlive();
});
