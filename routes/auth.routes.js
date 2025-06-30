const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../models/user");

// Render Signup Form
router.get("/signup", (req, res) => {
  res.render("auth/signup.ejs");
});

// Render Signin Form
router.get("/signin", (req, res) => {
  res.render("auth/signin.ejs");
});

// Handle Signup
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    req.flash("error", "Email is already registered.");
    return res.redirect("/signup");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });
  await user.save();

  req.flash("success", "Signup successful. Please login.");
  res.redirect("/signin");
});

// Handle Signin
// In your auth routes file
router.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user and validate password
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      // Set session
      req.session.userId = user._id;
      req.flash('success', 'Welcome back!');
      res.redirect('/main');
    } else {
      req.flash('error', 'Invalid credentials');
      res.redirect('/main');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed');
    res.redirect('/signin');
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  req.flash("success", "You have been logged out.");
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
