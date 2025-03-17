const express = require('express');
const router = express.Router();
const { ensureAuthenticated, isManager } = require('../middleware/auth');
const { User, Ticket, Equipment, Office, Comment, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Dashboard - GET
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    let dashboardData = {};
    
    // Common data for all roles
    const openTicketsCount = await Ticket.count({
      where: {
        status: {
          [Op.notIn]: ['closed', 'resolved']
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
      
      // Add role-specific message
      dashboardData.roleMessage = "As a helpdesk operator, you can create tickets and assign them to technicians.";
      dashboardData.recentTickets = recentTickets;
      
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
            [Op.notIn]: ['closed', 'resolved']
          }
        },
        include: [
          { model: User, as: 'creator', attributes: ['firstName', 'lastName'] }
        ],
        order: [['priority', 'DESC'], ['createdAt', 'ASC']],
        limit: 10
      });
      
      const equipmentCount = await Equipment.count();
      
      // Add role-specific message
      dashboardData.roleMessage = "As a technician, you can only update the status of tickets assigned to you.";
      dashboardData.assignedTickets = assignedTickets;
      dashboardData.equipmentCount = equipmentCount;
      
      return res.render('dashboard/technician', {
        title: 'Technician Dashboard',
        user: req.user,
        data: dashboardData
      });
    } 
    else if (user.role === 'manager') {
      // Manager dashboard data - only view access
      
      // Get current month and year for default reports
      const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = new Date().getFullYear();
      
      // Get all technicians for dropdown selection
      const technicians = await User.findAll({
        where: { role: 'technician', isActive: true },
        attributes: ['id', 'firstName', 'lastName']
      });
      
      // Get all offices for dropdown selection
      const offices = await Office.findAll({
        where: { isActive: true },
        attributes: ['id', 'name']
      });
      
      // Add role-specific message
      dashboardData.roleMessage = "As a manager, you can only view tickets and reports, not modify them.";
      dashboardData.technicians = technicians;
      dashboardData.offices = offices;
      dashboardData.currentMonth = currentMonth;
      dashboardData.currentYear = currentYear;
      
      // Default to current month for initial report
      const monthlyTicketSummary = await getMonthlyTicketSummary(currentMonth, currentYear);
      dashboardData.monthlyTicketSummary = monthlyTicketSummary;
      
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

// Monthly Ticket Summary Report - GET
router.get('/reports/monthly-summary', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      req.flash('error_msg', 'Month and year are required');
      return res.redirect('/dashboard');
    }
    
    const monthlyTicketSummary = await getMonthlyTicketSummary(month, year);
    
    res.render('dashboard/reports/monthly-summary', {
      title: `Monthly Ticket Summary - ${month}/${year}`,
      user: req.user,
      month,
      year,
      report: monthlyTicketSummary
    });
    
  } catch (err) {
    console.error('Error generating monthly ticket summary:', err);
    req.flash('error_msg', 'Error generating report');
    res.redirect('/dashboard');
  }
});

// Technician Job Sheet Report - GET
router.get('/reports/technician-summary', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      req.flash('error_msg', 'Month and year are required');
      return res.redirect('/dashboard');
    }
    
    const technicianSummary = await getTechnicianSummary(month, year);
    
    res.render('dashboard/reports/technician-summary', {
      title: `Technician Job Summary - ${month}/${year}`,
      user: req.user,
      month,
      year,
      report: technicianSummary
    });
    
  } catch (err) {
    console.error('Error generating technician summary:', err);
    req.flash('error_msg', 'Error generating report');
    res.redirect('/dashboard');
  }
});

// Office Jobs Summary Report - GET
router.get('/reports/office-summary', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const officeSummary = await getOfficeSummary();
    
    res.render('dashboard/reports/office-summary', {
      title: 'Office Jobs Summary',
      user: req.user,
      report: officeSummary
    });
    
  } catch (err) {
    console.error('Error generating office summary:', err);
    req.flash('error_msg', 'Error generating report');
    res.redirect('/dashboard');
  }
});

// Equipment Jobs Summary Report - GET
router.get('/reports/equipment-summary', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const equipmentSummary = await getEquipmentSummary();
    
    res.render('dashboard/reports/equipment-summary', {
      title: 'Equipment Jobs Summary',
      user: req.user,
      report: equipmentSummary
    });
    
  } catch (err) {
    console.error('Error generating equipment summary:', err);
    req.flash('error_msg', 'Error generating report');
    res.redirect('/dashboard');
  }
});

// Technician Detailed Report - GET
router.get('/reports/technician-detail', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { technicianId, month, year } = req.query;
    
    if (!technicianId || !month || !year) {
      req.flash('error_msg', 'Technician ID, month, and year are required');
      return res.redirect('/dashboard');
    }
    
    const technician = await User.findByPk(technicianId, {
      attributes: ['id', 'firstName', 'lastName']
    });
    
    if (!technician) {
      req.flash('error_msg', 'Technician not found');
      return res.redirect('/dashboard');
    }
    
    const technicianDetail = await getTechnicianDetail(technicianId, month, year);
    
    res.render('dashboard/reports/technician-detail', {
      title: `Technician Detail - ${technician.firstName} ${technician.lastName}`,
      user: req.user,
      technician,
      month,
      year,
      report: technicianDetail
    });
    
  } catch (err) {
    console.error('Error generating technician detail:', err);
    req.flash('error_msg', 'Error generating report');
    res.redirect('/dashboard');
  }
});

// Office Detailed Report - GET
router.get('/reports/office-detail', ensureAuthenticated, isManager, async (req, res) => {
  try {
    const { officeId, month, year } = req.query;
    
    if (!officeId || !month || !year) {
      req.flash('error_msg', 'Office ID, month, and year are required');
      return res.redirect('/dashboard');
    }
    
    const office = await Office.findByPk(officeId, {
      attributes: ['id', 'name', 'location']
    });
    
    if (!office) {
      req.flash('error_msg', 'Office not found');
      return res.redirect('/dashboard');
    }
    
    const officeDetail = await getOfficeDetail(officeId, month, year);
    
    res.render('dashboard/reports/office-detail', {
      title: `Office Detail - ${office.name}`,
      user: req.user,
      office,
      month,
      year,
      report: officeDetail
    });
    
  } catch (err) {
    console.error('Error generating office detail:', err);
    req.flash('error_msg', 'Error generating report');
    res.redirect('/dashboard');
  }
});

// Helper functions for reports

// Monthly Ticket Summary
async function getMonthlyTicketSummary(month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Format dates for SQL query
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  
  // Get all tickets for the month
  const tickets = await Ticket.findAll({
    where: {
      createdAt: {
        [Op.between]: [startDateStr, endDateStr]
      }
    },
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });
  
  // Count open and closed cases
  const openCases = tickets.filter(ticket => 
    ticket.status !== 'resolved' && ticket.status !== 'closed'
  ).length;
  
  const closedCases = tickets.filter(ticket => 
    ticket.status === 'resolved' || ticket.status === 'closed'
  );
  
  // Calculate time spent on closed cases
  let totalTimeSpent = 0;
  
  closedCases.forEach(ticket => {
    if (ticket.resolvedAt && ticket.createdAt) {
      const resolvedDate = new Date(ticket.resolvedAt);
      const createdDate = new Date(ticket.createdAt);
      const timeSpent = resolvedDate - createdDate; // Time in milliseconds
      totalTimeSpent += timeSpent;
    }
  });
  
  // Convert to hours
  const totalHours = Math.round(totalTimeSpent / (1000 * 60 * 60) * 10) / 10;
  
  return {
    totalTickets: tickets.length,
    openCases,
    closedCases: closedCases.length,
    totalTimeSpent: totalHours,
    averageTimePerCase: closedCases.length > 0 ? 
      Math.round((totalHours / closedCases.length) * 10) / 10 : 0,
    tickets
  };
}

// Technician Summary
async function getTechnicianSummary(month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Format dates for SQL query
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  
  // Get all technicians
  const technicians = await User.findAll({
    where: { role: 'technician', isActive: true },
    attributes: ['id', 'firstName', 'lastName']
  });
  
  // For each technician, get their tickets for the month
  const technicianSummaries = await Promise.all(
    technicians.map(async (technician) => {
      const tickets = await Ticket.findAll({
        where: {
          assignedTo: technician.id,
          createdAt: {
            [Op.between]: [startDateStr, endDateStr]
          }
        }
      });
      
      // Count open and closed cases
      const openCases = tickets.filter(ticket => 
        ticket.status !== 'resolved' && ticket.status !== 'closed'
      ).length;
      
      const closedCases = tickets.filter(ticket => 
        ticket.status === 'resolved' || ticket.status === 'closed'
      );
      
      // Calculate time spent
      let totalTimeSpent = 0;
      
      closedCases.forEach(ticket => {
        if (ticket.resolvedAt && ticket.createdAt) {
          const resolvedDate = new Date(ticket.resolvedAt);
          const createdDate = new Date(ticket.createdAt);
          const timeSpent = resolvedDate - createdDate; // Time in milliseconds
          totalTimeSpent += timeSpent;
        }
      });
      
      // Convert to hours
      const totalHours = Math.round(totalTimeSpent / (1000 * 60 * 60) * 10) / 10;
      
      return {
        technician,
        totalJobs: tickets.length,
        openCases,
        closedCases: closedCases.length,
        totalTimeSpent: totalHours
      };
    })
  );
  
  return technicianSummaries;
}

// Office Summary
async function getOfficeSummary() {
  // Get all offices
  const offices = await Office.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'location']
  });
  
  // For each office, get summary data
  const officeSummaries = await Promise.all(
    offices.map(async (office) => {
      // Get equipment in this office
      const equipment = await Equipment.findAll({
        where: { officeId: office.id },
        attributes: ['id']
      });
      
      const equipmentIds = equipment.map(eq => eq.id);
      
      // Get tickets for this office's equipment
      const tickets = await Ticket.findAll({
        where: {
          equipmentId: {
            [Op.in]: equipmentIds
          }
        },
        include: [
          { model: Equipment, attributes: ['id', 'type'] },
          { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
        ]
      });
      
      // Count hardware and software faults
      const hardwareFaults = tickets.filter(ticket => 
        ticket.Equipment && ['computer', 'printer', 'phone', 'network', 'server'].includes(ticket.Equipment.type)
      ).length;
      
      const softwareFaults = tickets.filter(ticket => 
        ticket.Equipment && ticket.Equipment.type === 'other'
      ).length;
      
      // Calculate time spent
      let totalTimeSpent = 0;
      
      tickets.forEach(ticket => {
        if (ticket.resolvedAt && ticket.createdAt) {
          const resolvedDate = new Date(ticket.resolvedAt);
          const createdDate = new Date(ticket.createdAt);
          const timeSpent = resolvedDate - createdDate; // Time in milliseconds
          totalTimeSpent += timeSpent;
        }
      });
      
      // Convert to hours
      const totalHours = Math.round(totalTimeSpent / (1000 * 60 * 60) * 10) / 10;
      
      // Count unique technicians
      const uniqueTechnicians = new Set();
      tickets.forEach(ticket => {
        if (ticket.assignee) {
          uniqueTechnicians.add(ticket.assignee.id);
        }
      });
      
      return {
        office,
        totalJobs: tickets.length,
        hardwareFaults,
        softwareFaults,
        totalTimeSpent: totalHours,
        uniqueTechnicians: uniqueTechnicians.size
      };
    })
  );
  
  return officeSummaries;
}

// Equipment Summary
async function getEquipmentSummary() {
  // Get all equipment
  const equipment = await Equipment.findAll({
    where: { status: 'active' },
    include: [
      { model: Office, attributes: ['id', 'name'] }
    ]
  });
  
  // For each equipment, get summary data
  const equipmentSummaries = await Promise.all(
    equipment.map(async (item) => {
      // Get tickets for this equipment
      const tickets = await Ticket.findAll({
        where: { equipmentId: item.id }
      });
      
      // Check if equipment needs replacing (based on number of tickets)
      const needsReplacing = tickets.length >= 5;
      
      // Check if equipment is under warranty
      const underWarranty = item.warrantyExpiration && new Date(item.warrantyExpiration) > new Date();
      
      return {
        equipment: item,
        totalJobs: tickets.length,
        needsReplacing,
        underWarranty
      };
    })
  );
  
  return equipmentSummaries;
}

// Technician Detail
async function getTechnicianDetail(technicianId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Format dates for SQL query
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  
  // Get technician's tickets for the month
  const tickets = await Ticket.findAll({
    where: {
      assignedTo: technicianId,
      createdAt: {
        [Op.between]: [startDateStr, endDateStr]
      }
    },
    include: [
      { 
        model: Equipment, 
        include: [{ model: Office, attributes: ['id', 'name'] }] 
      }
    ]
  });
  
  // Count open and closed cases
  const openCases = tickets.filter(ticket => 
    ticket.status !== 'resolved' && ticket.status !== 'closed'
  );
  
  const closedCases = tickets.filter(ticket => 
    ticket.status === 'resolved' || ticket.status === 'closed'
  );
  
  // Calculate time spent
  let totalTimeSpent = 0;
  
  closedCases.forEach(ticket => {
    if (ticket.resolvedAt && ticket.createdAt) {
      const resolvedDate = new Date(ticket.resolvedAt);
      const createdDate = new Date(ticket.createdAt);
      const timeSpent = resolvedDate - createdDate; // Time in milliseconds
      totalTimeSpent += timeSpent;
    }
  });
  
  // Convert to hours
  const totalHours = Math.round(totalTimeSpent / (1000 * 60 * 60) * 10) / 10;
  
  // Calculate average time per job
  const averageTime = closedCases.length > 0 ? 
    Math.round((totalHours / closedCases.length) * 10) / 10 : 0;
  
  return {
    tickets,
    openCases: openCases.length,
    closedCases: closedCases.length,
    totalTimeSpent: totalHours,
    averageTimePerJob: averageTime
  };
}

// Office Detail
async function getOfficeDetail(officeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Format dates for SQL query
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  
  // Get equipment in this office
  const equipment = await Equipment.findAll({
    where: { officeId },
    attributes: ['id', 'name', 'type']
  });
  
  const equipmentIds = equipment.map(eq => eq.id);
  
  // Get tickets for this office's equipment for the month
  const tickets = await Ticket.findAll({
    where: {
      equipmentId: {
        [Op.in]: equipmentIds
      },
      createdAt: {
        [Op.between]: [startDateStr, endDateStr]
      }
    },
    include: [
      { model: Equipment, attributes: ['id', 'name', 'type'] }
    ]
  });
  
  // Count open and closed cases
  const openCases = tickets.filter(ticket => 
    ticket.status !== 'resolved' && ticket.status !== 'closed'
  ).length;
  
  const closedCases = tickets.filter(ticket => 
    ticket.status === 'resolved' || ticket.status === 'closed'
  ).length;
  
  // Group tickets by equipment
  const ticketsByEquipment = {};
  
  tickets.forEach(ticket => {
    if (ticket.Equipment) {
      const equipmentId = ticket.Equipment.id;
      if (!ticketsByEquipment[equipmentId]) {
        ticketsByEquipment[equipmentId] = {
          equipment: ticket.Equipment,
          count: 0
        };
      }
      ticketsByEquipment[equipmentId].count++;
    }
  });
  
  // Convert to array and sort by count
  const equipmentSummary = Object.values(ticketsByEquipment).sort((a, b) => b.count - a.count);
  
  return {
    tickets,
    openCases,
    closedCases,
    totalJobs: tickets.length,
    equipmentSummary
  };
}

module.exports = router; 