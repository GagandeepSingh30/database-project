const express = require('express');
const router = express.Router();
const { User, Office } = require('../models');
const { ensureAuthenticated, isManager } = require('../middleware/auth');

// Get all users - GET (only for managers)
router.get('/', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Office }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    res.render('users/index', {
      title: 'Manage Users',
      users,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    req.flash('error_msg', 'Failed to fetch users');
    res.redirect('/');
  }
});

// View user details - GET (only for managers)
router.get('/:id', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const userDetails = await User.findByPk(req.params.id, {
      include: [{ model: Office }]
    });

    if (!userDetails) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users');
    }

    // Get all offices for the dropdown
    const offices = await Office.findAll({ where: { isActive: true } });

    res.render('users/view', {
      title: `User: ${userDetails.firstName} ${userDetails.lastName}`,
      userDetails,
      offices,
      user: req.user
    });
  } catch (err) {
    console.error('Error viewing user:', err);
    req.flash('error_msg', 'Failed to load user details');
    res.redirect('/users');
  }
});

// Update user - POST (only for managers)
router.post('/:id', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { firstName, lastName, email, role, officeId, isActive } = req.body;
    const userToUpdate = await User.findByPk(req.params.id);

    if (!userToUpdate) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users');
    }

    // Update user
    userToUpdate.firstName = firstName;
    userToUpdate.lastName = lastName;
    userToUpdate.email = email;
    userToUpdate.role = role;
    userToUpdate.officeId = officeId || null;
    userToUpdate.isActive = isActive === 'on';

    await userToUpdate.save();

    req.flash('success_msg', 'User updated successfully');
    res.redirect('/users');
  } catch (err) {
    console.error('Error updating user:', err);
    req.flash('error_msg', 'Failed to update user');
    res.redirect(`/users/${req.params.id}`);
  }
});

// Reset user password - POST (only for managers)
router.post('/:id/reset-password', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userToUpdate = await User.findByPk(req.params.id);

    if (!userToUpdate) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/users');
    }

    if (!newPassword || newPassword.length < 6) {
      req.flash('error_msg', 'Password should be at least 6 characters');
      return res.redirect(`/users/${req.params.id}`);
    }

    // Update password
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    req.flash('success_msg', 'Password reset successfully');
    res.redirect(`/users/${req.params.id}`);
  } catch (err) {
    console.error('Error resetting password:', err);
    req.flash('error_msg', 'Failed to reset password');
    res.redirect(`/users/${req.params.id}`);
  }
});

module.exports = router; 