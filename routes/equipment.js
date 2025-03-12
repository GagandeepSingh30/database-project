const express = require('express');
const router = express.Router();
const { Equipment, Office, Ticket } = require('../models');
const { ensureAuthenticated, isManager, isTechnicianOrManager } = require('../middleware/auth');

// Get all equipment - GET (only for technicians and managers)
router.get('/', ensureAuthenticated, isTechnicianOrManager, async (req, res) => {
  try {
    const equipment = await Equipment.findAll({
      include: [{ model: Office }],
      order: [['name', 'ASC']]
    });

    res.render('equipment/index', {
      title: 'Manage Equipment',
      equipment,
      user: req.user
    });
  } catch (err) {
    console.error('Error fetching equipment:', err);
    req.flash('error_msg', 'Failed to fetch equipment');
    res.redirect('/');
  }
});

// Create equipment page - GET (only for managers)
router.get('/create', ensureAuthenticated, isManager, async (req, res) => {
  try {
    // Get all offices for the dropdown
    const offices = await Office.findAll({ where: { isActive: true } });

    res.render('equipment/create', {
      title: 'Add New Equipment',
      offices,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading create equipment page:', err);
    req.flash('error_msg', 'Failed to load create equipment page');
    res.redirect('/equipment');
  }
});

// Create equipment - POST (only for managers)
router.post('/', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { name, type, serialNumber, model, purchaseDate, warrantyExpiration, officeId, notes } = req.body;
    const errors = [];

    // Validate input
    if (!name || !type || !officeId) {
      errors.push({ msg: 'Please fill in all required fields' });
    }

    if (errors.length > 0) {
      const offices = await Office.findAll({ where: { isActive: true } });
      return res.render('equipment/create', {
        title: 'Add New Equipment',
        errors,
        offices,
        formData: req.body,
        user: req.user
      });
    }

    // Check if serial number already exists (if provided)
    if (serialNumber) {
      const existingEquipment = await Equipment.findOne({ where: { serialNumber } });
      if (existingEquipment) {
        errors.push({ msg: 'An equipment with this serial number already exists' });
        const offices = await Office.findAll({ where: { isActive: true } });
        return res.render('equipment/create', {
          title: 'Add New Equipment',
          errors,
          offices,
          formData: req.body,
          user: req.user
        });
      }
    }

    // Create the equipment
    await Equipment.create({
      name,
      type,
      serialNumber: serialNumber || null,
      model: model || null,
      purchaseDate: purchaseDate || null,
      warrantyExpiration: warrantyExpiration || null,
      officeId,
      notes: notes || null
    });

    req.flash('success_msg', 'Equipment added successfully');
    res.redirect('/equipment');
  } catch (err) {
    console.error('Error creating equipment:', err);
    req.flash('error_msg', 'Failed to add equipment');
    res.redirect('/equipment/create');
  }
});

// View equipment details - GET (only for technicians and managers)
router.get('/:id', ensureAuthenticated, isTechnicianOrManager, async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id, {
      include: [{ model: Office }]
    });

    if (!equipment) {
      req.flash('error_msg', 'Equipment not found');
      return res.redirect('/equipment');
    }

    // Get related tickets
    const tickets = await Ticket.findAll({
      where: { equipmentId: equipment.id },
      order: [['createdAt', 'DESC']]
    });

    // Get all offices for the dropdown
    const offices = await Office.findAll({ where: { isActive: true } });

    res.render('equipment/view', {
      title: `Equipment: ${equipment.name}`,
      equipment,
      tickets,
      offices,
      user: req.user
    });
  } catch (err) {
    console.error('Error viewing equipment:', err);
    req.flash('error_msg', 'Failed to load equipment details');
    res.redirect('/equipment');
  }
});

// Update equipment - POST (only for managers)
router.post('/:id', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { name, type, serialNumber, model, purchaseDate, warrantyExpiration, officeId, status, notes } = req.body;
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      req.flash('error_msg', 'Equipment not found');
      return res.redirect('/equipment');
    }

    // Check if serial number is being changed and already exists
    if (serialNumber && serialNumber !== equipment.serialNumber) {
      const existingEquipment = await Equipment.findOne({ where: { serialNumber } });
      if (existingEquipment) {
        req.flash('error_msg', 'An equipment with this serial number already exists');
        return res.redirect(`/equipment/${equipment.id}`);
      }
    }

    // Update equipment
    equipment.name = name;
    equipment.type = type;
    equipment.serialNumber = serialNumber || null;
    equipment.model = model || null;
    equipment.purchaseDate = purchaseDate || null;
    equipment.warrantyExpiration = warrantyExpiration || null;
    equipment.officeId = officeId;
    equipment.status = status;
    equipment.notes = notes || null;

    await equipment.save();

    req.flash('success_msg', 'Equipment updated successfully');
    res.redirect('/equipment');
  } catch (err) {
    console.error('Error updating equipment:', err);
    req.flash('error_msg', 'Failed to update equipment');
    res.redirect(`/equipment/${req.params.id}`);
  }
});

module.exports = router; 