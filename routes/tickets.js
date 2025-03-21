const express = require('express');
const router = express.Router();
const { Ticket, User, Equipment, Comment, Office, Sequelize } = require('../models');
const { 
  ensureAuthenticated, 
  isHelpdesk, 
  isTechnician, 
  isManager, 
  isHelpdeskOrManager,
  canCreateTicket,
  canUpdateTicketStatus,
  canViewTicketOnly
} = require('../middleware/auth');

// Get all tickets - GET
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    let tickets;
    const user = req.user;

    // Filter tickets based on user role
    if (user.role === 'helpdesk') {
      // Helpdesk operators can see all tickets
      tickets = await Ticket.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
          { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
          { model: Equipment, attributes: ['id', 'name', 'type'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else if (user.role === 'technician') {
      // Technicians can see tickets assigned to them and unassigned tickets
      tickets = await Ticket.findAll({
        where: {
          [Sequelize.Op.or]: [
            { assignedTo: user.id },
            { assignedTo: null }
          ]
        },
        include: [
          { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
          { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
          { model: Equipment, attributes: ['id', 'name', 'type'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else if (user.role === 'manager') {
      // Managers can see all tickets
      tickets = await Ticket.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
          { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
          { model: Equipment, attributes: ['id', 'name', 'type'] }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.render('tickets/index', {
      title: 'All Tickets',
      tickets,
      user
    });
  } catch (err) {
    console.error('Error fetching tickets:', err);
    req.flash('error_msg', 'Failed to fetch tickets');
    res.redirect('/');
  }
});

// Create ticket page - GET (only for helpdesk operators)
router.get('/create', ensureAuthenticated, canCreateTicket, async (req, res) => {
  try {
    // Get all equipment for the dropdown
    const equipment = await Equipment.findAll({
      where: { status: 'active' },
      include: [{ model: Office }]
    });

    res.render('tickets/create', {
      title: 'Create New Ticket',
      equipment,
      user: req.user
    });
  } catch (err) {
    console.error('Error loading create ticket page:', err);
    req.flash('error_msg', 'Failed to load create ticket page');
    res.redirect('/tickets');
  }
});

// Create ticket - POST (only for helpdesk operators)
router.post('/', ensureAuthenticated, canCreateTicket, async (req, res) => {
  try {
    const { title, description, priority, equipmentId } = req.body;
    const errors = [];

    // Validate input
    if (!title || !description) {
      errors.push({ msg: 'Please fill in all required fields' });
    }

    if (errors.length > 0) {
      const equipment = await Equipment.findAll({
        where: { status: 'active' },
        include: [{ model: Office }]
      });

      return res.render('tickets/create', {
        title: 'Create New Ticket',
        errors,
        equipment,
        formData: req.body,
        user: req.user
      });
    }

    // Create the ticket
    await Ticket.create({
      title,
      description,
      priority: priority || 'medium',
      equipmentId: equipmentId || null,
      createdBy: req.user.id
    });

    req.flash('success_msg', 'Ticket created successfully');
    res.redirect('/tickets');
  } catch (err) {
    console.error('Error creating ticket:', err);
    req.flash('error_msg', 'Failed to create ticket');
    res.redirect('/tickets/create');
  }
});

// View ticket details - GET
router.get('/:id', ensureAuthenticated, canViewTicketOnly, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
        { model: Equipment, include: [{ model: Office }] },
        { 
          model: Comment,
          include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'role'] }]
        }
      ]
    });

    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/tickets');
    }

    // Get technicians for assignment dropdown
    const technicians = await User.findAll({
      where: { role: 'technician', isActive: true }
    });

    res.render('tickets/view', {
      title: `Ticket #${ticket.id}`,
      ticket,
      technicians,
      user: req.user
    });
  } catch (err) {
    console.error('Error viewing ticket:', err);
    req.flash('error_msg', 'Failed to load ticket details');
    res.redirect('/tickets');
  }
});

// Assign ticket - POST (for helpdesk operators only, not managers)
router.post('/:id/assign', ensureAuthenticated, canCreateTicket, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/tickets');
    }

    // Update ticket
    ticket.assignedTo = assignedTo;
    ticket.status = 'assigned';
    await ticket.save();

    // Add comment about assignment
    const assignee = await User.findByPk(assignedTo);
    await Comment.create({
      content: `Ticket assigned to ${assignee.firstName} ${assignee.lastName}`,
      ticketId: ticket.id,
      userId: req.user.id,
      isInternal: true
    });

    req.flash('success_msg', 'Ticket assigned successfully');
    res.redirect(`/tickets/${ticket.id}`);
  } catch (err) {
    console.error('Error assigning ticket:', err);
    req.flash('error_msg', 'Failed to assign ticket');
    res.redirect(`/tickets/${req.params.id}`);
  }
});

// Update ticket status - POST (only for technicians)
router.post('/:id/status', ensureAuthenticated, canUpdateTicketStatus, async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      req.flash('error_msg', 'Ticket not found');
      return res.redirect('/tickets');
    }

    // Check if technician is assigned to this ticket
    if (ticket.assignedTo !== req.user.id) {
      req.flash('error_msg', 'You can only update tickets assigned to you');
      return res.redirect(`/tickets/${ticket.id}`);
    }

    // Require resolution notes for any status update
    if (!resolutionNotes) {
      req.flash('error_msg', 'Description is required when updating a ticket status');
      return res.redirect(`/tickets/${ticket.id}`);
    }
    
    // Update ticket status
    ticket.status = status;
    
    // Add resolution notes if provided
    if (status === 'resolved') {
      ticket.resolutionNotes = resolutionNotes;
      ticket.resolvedAt = new Date();
    }
    
    await ticket.save();

    // Add comment about status change with the description
    await Comment.create({
      content: `Ticket status changed to ${status}. Description: ${resolutionNotes}`,
      ticketId: ticket.id,
      userId: req.user.id,
      isInternal: false
    });

    req.flash('success_msg', 'Ticket status updated successfully');
    res.redirect(`/tickets/${ticket.id}`);
  } catch (err) {
    console.error('Error updating ticket status:', err);
    req.flash('error_msg', 'Failed to update ticket status');
    res.redirect(`/tickets/${req.params.id}`);
  }
});

// Add comment - POST
router.post('/:id/comments', ensureAuthenticated, async (req, res) => {
  try {
    // Managers cannot add comments
    if (req.user.role === 'manager') {
      req.flash('error_msg', 'Managers cannot add comments to tickets');
      return res.redirect(`/tickets/${req.params.id}`);
    }
    
    const { content, isInternal } = req.body;
    const ticketId = req.params.id;

    if (!content) {
      req.flash('error_msg', 'Comment cannot be empty');
      return res.redirect(`/tickets/${ticketId}`);
    }

    // Only technicians can add internal comments
    const isInternalComment = req.user.role === 'technician' && isInternal === 'on';

    // Create comment
    await Comment.create({
      content,
      isInternal: isInternalComment,
      ticketId,
      userId: req.user.id
    });

    req.flash('success_msg', 'Comment added successfully');
    res.redirect(`/tickets/${ticketId}`);
  } catch (err) {
    console.error('Error adding comment:', err);
    req.flash('error_msg', 'Failed to add comment');
    res.redirect(`/tickets/${req.params.id}`);
  }
});

module.exports = router; 