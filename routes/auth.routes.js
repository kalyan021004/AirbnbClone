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
router.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) {
    req.flash("error", "Invalid username.");
    return res.redirect("/signin");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    req.flash("error", "Incorrect password.");
    return res.redirect("/signin");
  }

  req.session.userId = user._id;
  req.flash("success", `Welcome back, ${user.username}!`);
  res.redirect("/main");
});

// Logout Route
router.get("/logout", (req, res) => {
  req.flash("success", "You have been logged out.");
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
