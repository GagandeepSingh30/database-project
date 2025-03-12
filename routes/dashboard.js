const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { User, Ticket, Equipment, Office, sequelize } = require('../models');
const { Op } = require('sequelize');

// Dashboard - GET
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    let dashboardData = {};
    
    // Common data for all roles
    const openTicketsCount = await Ticket.count({
      where: {
        status: {
          [Op.notIn]: ['Closed', 'Resolved']
        }
      }
    });
    
    dashboardData.openTicketsCount = openTicketsCount;
    
    // Role-specific data
    if (user.role === 'helpdesk') {
      // Helpdesk operator dashboard data
      const recentTickets = await Ticket.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['firstName', 'lastName'] },
          { model: User, as: 'assignee', attributes: ['firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      const pendingTicketsCount = await Ticket.count({
        where: {
          status: 'Pending'
        }
      });
      
      dashboardData.recentTickets = recentTickets;
      dashboardData.pendingTicketsCount = pendingTicketsCount;
      
      return res.render('dashboard/helpdesk', {
        title: 'Helpdesk Dashboard',
        user: req.user,
        data: dashboardData
      });
    } 
    else if (user.role === 'technician') {
      // Technician dashboard data
      const assignedTickets = await Ticket.findAll({
        where: {
          assignedTo: user.id,
          status: {
            [Op.notIn]: ['Closed', 'Resolved']
          }
        },
        include: [
          { model: User, as: 'creator', attributes: ['firstName', 'lastName'] }
        ],
        order: [['priority', 'DESC'], ['createdAt', 'ASC']],
        limit: 10
      });
      
      const equipmentCount = await Equipment.count();
      
      dashboardData.assignedTickets = assignedTickets;
      dashboardData.equipmentCount = equipmentCount;
      
      return res.render('dashboard/technician', {
        title: 'Technician Dashboard',
        user: req.user,
        data: dashboardData
      });
    } 
    else if (user.role === 'manager') {
      // Manager dashboard data
      const ticketsByStatus = await Ticket.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
        group: ['status']
      });
      
      const usersByRole = await User.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('role')), 'count']],
        group: ['role']
      });
      
      const recentTickets = await Ticket.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['firstName', 'lastName'] },
          { model: User, as: 'assignee', attributes: ['firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      dashboardData.ticketsByStatus = ticketsByStatus;
      dashboardData.usersByRole = usersByRole;
      dashboardData.recentTickets = recentTickets;
      
      return res.render('dashboard/manager', {
        title: 'Manager Dashboard',
        user: req.user,
        data: dashboardData
      });
    }
    
    // Fallback to generic dashboard if role is not recognized
    return res.render('dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      data: dashboardData
    });
    
  } catch (err) {
    console.error('Error loading dashboard:', err);
    req.flash('error_msg', 'Error loading dashboard data');
    return res.redirect('/');
  }
});

module.exports = router; 