const express = require('express');
const router = express.Router();
const { Office, User, Equipment } = require('../models');
const { ensureAuthenticated, isManager } = require('../middleware/auth');

// Get all offices - GET (only for managers)
router.get('/', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const offices = await Office.findAll({
      order: [['name', 'ASC']]
    });

    res.render('offices/index', {
      title: 'Manage Offices',
      offices,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching offices:', err);
    req.flash('error_msg', 'Failed to fetch offices');
    res.redirect('/');
  }
});

// Create office page - GET (only for managers)
router.get('/create', ensureAuthenticated, isManager, (req, res) => {
  res.render('offices/create', {
    title: 'Create New Office',
    user: req.user
  });
});

// Create office - POST (only for managers)
router.post('/', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { name, location, address, phone } = req.body;
    const errors = [];

    // Validate input
    if (!name || !location || !address) {
      errors.push({ msg: 'Please fill in all required fields' });
    }

    if (errors.length > 0) {
      return res.render('offices/create', {
        title: 'Create New Office',
        errors,
        formData: req.body,
        user: req.user
      });
    }

    // Check if office name already exists
    const existingOffice = await Office.findOne({ where: { name } });
    if (existingOffice) {
      errors.push({ msg: 'An office with this name already exists' });
      return res.render('offices/create', {
        title: 'Create New Office',
        errors,
        formData: req.body,
        user: req.user
      });
    }

    // Create the office
    await Office.create({
      name,
      location,
      address,
      phone: phone || null
    });

    req.flash('success_msg', 'Office created successfully');
    res.redirect('/offices');
  } catch (err) {
    console.error('Error creating office:', err);
    req.flash('error_msg', 'Failed to create office');
    res.redirect('/offices/create');
  }
});

// View office details - GET (only for managers)
router.get('/:id', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const office = await Office.findByPk(req.params.id);

    if (!office) {
      req.flash('error_msg', 'Office not found');
      return res.redirect('/offices');
    }

    // Get users and equipment for this office
    const users = await User.findAll({
      where: { officeId: office.id },
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    const equipment = await Equipment.findAll({
      where: { officeId: office.id },
      order: [['name', 'ASC']]
    });

    res.render('offices/view', {
      title: `Office: ${office.name}`,
      office,
      users,
      equipment,
      user: req.user
    });
  } catch (err) {
    console.error('Error viewing office:', err);
    req.flash('error_msg', 'Failed to load office details');
    res.redirect('/offices');
  }
});

// Update office - POST (only for managers)
router.post('/:id', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { name, location, address, phone, isActive } = req.body;
    const office = await Office.findByPk(req.params.id);

    if (!office) {
      req.flash('error_msg', 'Office not found');
      return res.redirect('/offices');
    }

    // Check if name is being changed and already exists
    if (name !== office.name) {
      const existingOffice = await Office.findOne({ where: { name } });
      if (existingOffice) {
        req.flash('error_msg', 'An office with this name already exists');
        return res.redirect(`/offices/${office.id}`);
      }
    }

    // Update office
    office.name = name;
    office.location = location;
    office.address = address;
    office.phone = phone || null;
    office.isActive = isActive === 'on';

    await office.save();

    req.flash('success_msg', 'Office updated successfully');
    res.redirect('/offices');
  } catch (err) {
    console.error('Error updating office:', err);
    req.flash('error_msg', 'Failed to update office');
    res.redirect(`/offices/${req.params.id}`);
  }
});

module.exports = router;