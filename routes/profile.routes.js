const express = require('express');
const router = express.Router();
const { isLoggedIn } = require("../middleware");   // <-- Destructure here
const User = require('../models/user');
const Listing = require('../models/listings');

// rest of your code ...


// Profile view
router.get('/profile', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
    res.render('profile/view', { user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Profile edit form
router.get('/profile/edit', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
    res.render('profile/edit', { user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Profile edit submit
router.post('/profile/edit', isLoggedIn, async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId, 
      { username, email }, 
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      req.flash('error', 'Please check your input data');
    } else {
      req.flash('error', 'Failed to update profile');
    }
    res.redirect('/profile/edit');
  }
});

// Settings view
router.get('/profile/settings', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
    res.render('profile/settings', { user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Settings save
router.post('/profile/settings', isLoggedIn, async (req, res, next) => {
  try {
    const { emailNotifications } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId, 
      { emailNotifications: emailNotifications === 'on' },
      { new: true }
    );
    if (!updatedUser) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
    req.flash('success', 'Settings saved successfully');
    res.redirect('/profile/settings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to save settings');
    res.redirect('/profile/settings');
  }
});
module.exports = router;