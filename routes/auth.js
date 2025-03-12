const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const { User, Office } = require('../models');
const { ensureAuthenticated, isManager } = require('../middleware/auth');

// Login page - GET
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    title: 'Login',
    user: req.user
  });
});

// Login - POST
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

// Register page - GET (public access)
router.get('/register', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  
  // Fetch offices for the dropdown
  Office.findAll({ order: [['name', 'ASC']] })
    .then(offices => {
      res.render('auth/register', {
        title: 'Register Account',
        user: req.user,
        offices
      });
    })
    .catch(err => {
      console.error('Error fetching offices:', err);
      res.render('auth/register', {
        title: 'Register Account',
        user: req.user,
        offices: []
      });
    });
});

// Register - POST (public access)
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role, officeId } = req.body;
  const errors = [];

  // Check required fields
  if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
    errors.push({ msg: 'Please fill in all required fields' });
  }

  // Check passwords match
  if (password !== confirmPassword) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  // Check if role is valid
  const validRoles = ['helpdesk', 'technician', 'manager'];
  if (!validRoles.includes(role)) {
    errors.push({ msg: 'Invalid role selected' });
  }

  // Fetch offices for rendering the form again if there are errors
  const offices = await Office.findAll({ order: [['name', 'ASC']] }).catch(err => {
    console.error('Error fetching offices:', err);
    return [];
  });

  if (errors.length > 0) {
    return res.render('auth/register', {
      title: 'Register Account',
      errors,
      firstName,
      lastName,
      email,
      role,
      officeId,
      user: req.user,
      offices
    });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('auth/register', {
        title: 'Register Account',
        errors,
        firstName,
        lastName,
        email,
        role,
        officeId,
        user: req.user,
        offices
      });
    }

    // Create new user
    await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      officeId: officeId || null
    });

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Error registering user:', err);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/register');
  }
});

// Admin register page - GET (only accessible by managers)
router.get('/admin/register', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const offices = await Office.findAll({ order: [['name', 'ASC']] });
    res.render('auth/admin-register', {
      title: 'Register New User (Admin)',
      user: req.user,
      offices
    });
  } catch (err) {
    console.error('Error fetching offices:', err);
    req.flash('error_msg', 'Error loading registration form');
    res.redirect('/users');
  }
});

// Admin register - POST (only accessible by managers)
router.post('/admin/register', ensureAuthenticated, isManager, async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, role, officeId } = req.body;
  const errors = [];

  // Check required fields
  if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
    errors.push({ msg: 'Please fill in all required fields' });
  }

  // Check passwords match
  if (password !== confirmPassword) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  // Check if role is valid
  const validRoles = ['helpdesk', 'technician', 'manager'];
  if (!validRoles.includes(role)) {
    errors.push({ msg: 'Invalid role selected' });
  }

  // Fetch offices for rendering the form again if there are errors
  const offices = await Office.findAll({ order: [['name', 'ASC']] }).catch(err => {
    console.error('Error fetching offices:', err);
    return [];
  });

  if (errors.length > 0) {
    return res.render('auth/admin-register', {
      title: 'Register New User (Admin)',
      errors,
      firstName,
      lastName,
      email,
      role,
      officeId,
      user: req.user,
      offices
    });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('auth/admin-register', {
        title: 'Register New User (Admin)',
        errors,
        firstName,
        lastName,
        email,
        role,
        officeId,
        user: req.user,
        offices
      });
    }

    // Create new user
    await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      officeId: officeId || null
    });

    req.flash('success_msg', 'User registered successfully');
    res.redirect('/users');
  } catch (err) {
    console.error('Error registering user:', err);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/admin/register');
  }
});

// Logout - GET
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      console.error('Error during logout:', err);
      return next(err); 
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
});

// Profile page - GET
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('auth/profile', {
    title: 'My Profile',
    user: req.user
  });
});

// Update profile - POST
router.post('/profile', ensureAuthenticated, async (req, res) => {
  const { firstName, lastName, currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  // Check required fields
  if (!firstName || !lastName) {
    errors.push({ msg: 'Please fill in all required fields' });
  }

  // If user is trying to change password
  if (currentPassword && newPassword) {
    // Check passwords match
    if (newPassword !== confirmPassword) {
      errors.push({ msg: 'New passwords do not match' });
    }

    // Check password length
    if (newPassword.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      errors.push({ msg: 'Current password is incorrect' });
    }
  }

  if (errors.length > 0) {
    return res.render('auth/profile', {
      title: 'My Profile',
      errors,
      user: req.user
    });
  }

  try {
    // Update user
    const user = await User.findByPk(req.user.id);
    user.firstName = firstName;
    user.lastName = lastName;
    
    if (currentPassword && newPassword && confirmPassword) {
      user.password = newPassword;
    }

    await user.save();

    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/auth/profile');
  } catch (err) {
    console.error('Error updating profile:', err);
    req.flash('error_msg', 'An error occurred while updating profile');
    res.redirect('/auth/profile');
  }
});

module.exports = router; 