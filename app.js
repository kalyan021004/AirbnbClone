const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const MongoStore = require("connect-mongo");
require('dotenv').config();

const listingRoutes = require("./routes/listing.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const reviewRoutes = require("./routes/review.routes.js");
const profileRoutes = require('./routes/profile.routes.js');

// Import your User model
const User = require("./models/user.js");

const app = express();
const MONGO_URL = process.env.MONGO_URL;
const SESSION_SECRET = process.env.SESSION_SECRET || "defaultSecret";
const PORT = process.env.PORT || 8080;

// Connect to MongoDB first
mongoose.connect(MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Session configuration
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URL,
      ttl: 24 * 60 * 60, // 1 day session expiration
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: false, // Set to true if using HTTPS in production
      httpOnly: true, // Security: prevent XSS attacks
    },
  })
);

app.use(flash());

// Set up view engine and middleware BEFORE user middleware
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Enhanced currentUser middleware with better error handling and logging
app.use(async (req, res, next) => {
  try {
    const userId = req.session.userId;
    
    // Debug logging - remove in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Session ID:', req.sessionID);
      console.log('User ID from session:', userId);
    }

    if (userId) {
      try {
        const user = await User.findById(userId).select("-password");
        if (user) {
          res.locals.currentUser = user;
          req.user = user; // Also set on req object for consistency
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('Current user found:', user.username || user.email);
          }
        } else {
          // User ID in session but user doesn't exist in DB
          console.warn('User ID in session but user not found in database');
          req.session.destroy((err) => {
            if (err) console.error('Error destroying session:', err);
          });
          res.locals.currentUser = null;
          req.user = null;
        }
      } catch (dbError) {
        console.error("Database error fetching user:", dbError);
        res.locals.currentUser = null;
        req.user = null;
      }
    } else {
      res.locals.currentUser = null;
      req.user = null;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('No user ID in session');
      }
    }

    // Set flash messages
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    
    next();
  } catch (error) {
    console.error("Error in currentUser middleware:", error);
    res.locals.currentUser = null;
    req.user = null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
  }
});

// Routes
app.use("/", listingRoutes);
app.use("/", authRoutes);
app.use("/listings/:id/reviews", reviewRoutes);
app.use('/', profileRoutes);

// Home route
app.get("/", (req, res) => {
  res.render("listings/home.ejs");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('error', { 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Page not found',
    error: {}
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});