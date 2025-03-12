const bcrypt = require('bcrypt');
const { User, Office, Equipment, Ticket, Comment } = require('../models');

// Function to seed the database with initial data
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Create offices
    const offices = await Office.bulkCreate([
      {
        name: 'Headquarters',
        location: 'New York',
        address: '123 Main St, New York, NY 10001',
        phone: '212-555-1234'
      },
      {
        name: 'West Coast Office',
        location: 'San Francisco',
        address: '456 Market St, San Francisco, CA 94105',
        phone: '415-555-6789'
      },
      {
        name: 'South Office',
        location: 'Austin',
        address: '789 Congress Ave, Austin, TX 78701',
        phone: '512-555-4321'
      }
    ]);

    console.log('Offices created successfully');

    // Create users with hashed passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.bulkCreate([
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'manager',
        officeId: offices[0].id
      },
      {
        firstName: 'Tech',
        lastName: 'Support',
        email: 'tech@example.com',
        password: hashedPassword,
        role: 'technician',
        officeId: offices[0].id
      },
      {
        firstName: 'Help',
        lastName: 'Desk',
        email: 'helpdesk@example.com',
        password: hashedPassword,
        role: 'helpdesk',
        officeId: offices[0].id
      },
      {
        firstName: 'West',
        lastName: 'Tech',
        email: 'westtech@example.com',
        password: hashedPassword,
        role: 'technician',
        officeId: offices[1].id
      },
      {
        firstName: 'South',
        lastName: 'Support',
        email: 'southsupport@example.com',
        password: hashedPassword,
        role: 'helpdesk',
        officeId: offices[2].id
      }
    ]);

    console.log('Users created successfully');

    // Create equipment
    const equipment = await Equipment.bulkCreate([
      {
        name: 'Main Server',
        type: 'server',
        serialNumber: 'SRV-001-2023',
        model: 'Dell PowerEdge R740',
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiration: new Date('2026-01-15'),
        status: 'active',
        officeId: offices[0].id,
        notes: 'Primary application server'
      },
      {
        name: 'Reception Printer',
        type: 'printer',
        serialNumber: 'PRN-002-2022',
        model: 'HP LaserJet Pro M404dn',
        purchaseDate: new Date('2022-06-10'),
        warrantyExpiration: new Date('2024-06-10'),
        status: 'active',
        officeId: offices[0].id
      },
      {
        name: 'Network Switch - Floor 1',
        type: 'network',
        serialNumber: 'NSW-003-2023',
        model: 'Cisco Catalyst 9200',
        purchaseDate: new Date('2023-03-22'),
        warrantyExpiration: new Date('2026-03-22'),
        status: 'active',
        officeId: offices[0].id
      },
      {
        name: 'West Office Server',
        type: 'server',
        serialNumber: 'SRV-004-2022',
        model: 'Dell PowerEdge R640',
        purchaseDate: new Date('2022-11-05'),
        warrantyExpiration: new Date('2025-11-05'),
        status: 'active',
        officeId: offices[1].id
      },
      {
        name: 'Conference Room Phone',
        type: 'phone',
        serialNumber: 'PHN-005-2023',
        model: 'Polycom VVX 450',
        purchaseDate: new Date('2023-02-18'),
        warrantyExpiration: new Date('2025-02-18'),
        status: 'active',
        officeId: offices[2].id
      }
    ]);

    console.log('Equipment created successfully');

    // Create tickets
    const tickets = await Ticket.bulkCreate([
      {
        title: 'Server not responding',
        description: 'The main server is not responding to ping requests. Need immediate assistance.',
        priority: 'critical',
        status: 'assigned',
        createdBy: users[2].id, // helpdesk
        assignedTo: users[1].id, // tech
        equipmentId: equipment[0].id
      },
      {
        title: 'Printer paper jam',
        description: 'Reception printer has a paper jam and displays error code E502.',
        priority: 'medium',
        status: 'open',
        createdBy: users[2].id, // helpdesk
        equipmentId: equipment[1].id
      },
      {
        title: 'New employee setup',
        description: 'Need to set up workstation for new employee starting on Monday.',
        priority: 'low',
        status: 'in_progress',
        createdBy: users[4].id, // south helpdesk
        assignedTo: users[1].id, // tech
        equipmentId: null
      },
      {
        title: 'Network connectivity issues',
        description: 'Users on Floor 1 reporting intermittent network connectivity issues.',
        priority: 'high',
        status: 'open',
        createdBy: users[2].id, // helpdesk
        equipmentId: equipment[2].id
      },
      {
        title: 'Software installation request',
        description: 'Need Adobe Creative Suite installed on marketing department computers.',
        priority: 'medium',
        status: 'assigned',
        createdBy: users[2].id, // helpdesk
        assignedTo: users[3].id, // west tech
        equipmentId: null
      }
    ]);

    console.log('Tickets created successfully');

    // Create comments
    await Comment.bulkCreate([
      {
        content: 'I\'ve started investigating the server issue. Initial diagnostics show possible hardware failure.',
        isInternal: false,
        ticketId: tickets[0].id,
        userId: users[1].id // tech
      },
      {
        content: 'Ordered replacement parts. Should arrive tomorrow.',
        isInternal: true,
        ticketId: tickets[0].id,
        userId: users[1].id // tech
      },
      {
        content: 'Have you tried turning it off and on again?',
        isInternal: false,
        ticketId: tickets[1].id,
        userId: users[0].id // admin
      },
      {
        content: 'Workstation setup is 50% complete. Waiting for software licenses.',
        isInternal: false,
        ticketId: tickets[2].id,
        userId: users[1].id // tech
      },
      {
        content: 'I\'ll be on site tomorrow to check the network switch.',
        isInternal: false,
        ticketId: tickets[3].id,
        userId: users[1].id // tech
      }
    ]);

    console.log('Comments created successfully');
    console.log('Database seeding completed successfully!');

    return {
      offices,
      users,
      equipment,
      tickets
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seedDatabase; 