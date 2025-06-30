const express = require('express');
const router = express.Router();
const { isLoggedIn } = require("../middleware");   // <-- Destructure here
const User = require('../models/user');
const Listing = require('../models/listings');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

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


// GET Settings page
router.get('/profile/settings', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }
    res.render('profile/settings', { user, errors: {} });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// POST Settings save - handle profile update or password change
router.post('/profile/settings', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    const action = req.body.action;

    if (action === 'updateProfile') {
      // Validate inputs if needed
      const { username, email, bio } = req.body;
      user.username = username.trim();
      user.email = email.trim();
      user.bio = bio ? bio.trim() : '';

      await user.save();

      req.flash('success', 'Profile info updated successfully');
      return res.redirect('/profile/settings');

    } else if (action === 'changePassword') {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;

      // Basic validation
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.render('profile/settings', { user, errors: { password: 'All password fields are required.' } });
      }
      if (newPassword !== confirmNewPassword) {
        return res.render('profile/settings', { user, errors: { password: 'New passwords do not match.' } });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.render('profile/settings', { user, errors: { password: 'Current password is incorrect.' } });
      }

      // Hash new password and save
      user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await user.save();

      req.flash('success', 'Password changed successfully');
      return res.redirect('/profile/settings');

    } else {
      req.flash('error', 'Invalid action');
      return res.redirect('/profile/settings');
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to save settings');
    res.redirect('/profile/settings');
  }
});

// POST Preferences update (optional, if separate form)
router.post('/profile/settings/preferences', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    // Assume you have these preferences on user model
    user.emailNotifications = req.body.emailNotifications === 'on';
    user.darkMode = req.body.darkMode === 'on';

    await user.save();

    req.flash('success', 'Preferences saved successfully');
    res.redirect('/profile/settings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to save preferences');
    res.redirect('/profile/settings');
  }
});

module.exports = router;