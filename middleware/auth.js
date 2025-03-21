// Authentication middleware
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this resource');
  res.redirect('/auth/login');
};

// Role-based access control middleware
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error_msg', 'Please log in to access this resource');
      return res.redirect('/auth/login');
    }

    if (roles.includes(req.user.role)) {
      return next();
    } else {
      req.flash('error_msg', 'You do not have permission to access this resource');
      return res.redirect('/');
    }
  };
};

// Specific role middleware
exports.isHelpdesk = (req, res, next) => {
  if (req.user && req.user.role === 'helpdesk') {
    return next();
  }
  req.flash('error_msg', 'Only Helpdesk Operators can access this resource');
  res.redirect('/');
};

exports.isTechnician = (req, res, next) => {
  if (req.user && req.user.role === 'technician') {
    return next();
  }
  req.flash('error_msg', 'Only IT Technicians can access this resource');
  res.redirect('/');
};

exports.isManager = (req, res, next) => {
  if (req.user && req.user.role === 'manager') {
    return next();
  }
  req.flash('error_msg', 'Only Managers can access this resource');
  res.redirect('/');
};

// Combined roles middleware
exports.isHelpdeskOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'helpdesk' || req.user.role === 'manager')) {
    return next();
  }
  req.flash('error_msg', 'Only Helpdesk Operators or Managers can access this resource');
  res.redirect('/');
};

exports.isTechnicianOrManager = (req, res, next) => {
  if (req.user && (req.user.role === 'technician' || req.user.role === 'manager')) {
    return next();
  }
  req.flash('error_msg', 'Only IT Technicians or Managers can access this resource');
  res.redirect('/');
};

// New middleware for ticket-specific permissions

// Only helpdesk operators can create tickets
exports.canCreateTicket = (req, res, next) => {
  if (req.user && req.user.role === 'helpdesk') {
    return next();
  }
  req.flash('error_msg', 'Only Helpdesk Operators can create tickets');
  res.redirect('/tickets');
};

// Only technicians can update ticket status
exports.canUpdateTicketStatus = (req, res, next) => {
  if (req.user && req.user.role === 'technician') {
    return next();
  }
  req.flash('error_msg', 'Only IT Technicians can update ticket status');
  res.redirect('/tickets');
};

// Managers can only view tickets, not modify them
exports.canViewTicketOnly = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  if (req.user && req.user.role === 'manager') {
    req.flash('error_msg', 'Managers can only view tickets, not modify them');
    return res.redirect('/tickets');
  }
  return next();
}; 