require('dotenv').config();
const { sequelize } = require('./models');
const { User, Office, Equipment, Ticket, Comment } = require('./models');
const bcrypt = require('bcryptjs');

async function seedReportsData() {
  try {
    console.log('Starting to seed reports data...');

    // Create offices if they don't exist
    const offices = [
      { name: 'Headquarters', location: 'London', phone: '020-7123-4567', email: 'hq@company.com' },
      { name: 'North Branch', location: 'Manchester', phone: '0161-456-7890', email: 'north@company.com' },
      { name: 'South Branch', location: 'Brighton', phone: '01273-789-0123', email: 'south@company.com' },
      { name: 'East Branch', location: 'Norwich', phone: '01603-234-5678', email: 'east@company.com' },
      { name: 'West Branch', location: 'Bristol', phone: '0117-345-6789', email: 'west@company.com' }
    ];

    for (const officeData of offices) {
      const [office, created] = await Office.findOrCreate({
        where: { name: officeData.name },
        defaults: officeData
      });
      
      if (created) {
        console.log(`Created office: ${office.name}`);
      }
    }

    // Create technicians if they don't exist
    const technicians = [
      { 
        firstName: 'John', lastName: 'Smith', email: 'john.smith@company.com', 
        password: await bcrypt.hash('password123', 10), role: 'technician' 
      },
      { 
        firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@company.com', 
        password: await bcrypt.hash('password123', 10), role: 'technician' 
      },
      { 
        firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@company.com', 
        password: await bcrypt.hash('password123', 10), role: 'technician' 
      },
      { 
        firstName: 'Emma', lastName: 'Davis', email: 'emma.davis@company.com', 
        password: await bcrypt.hash('password123', 10), role: 'technician' 
      },
      { 
        firstName: 'David', lastName: 'Wilson', email: 'david.wilson@company.com', 
        password: await bcrypt.hash('password123', 10), role: 'technician' 
      }
    ];

    for (const techData of technicians) {
      const [tech, created] = await User.findOrCreate({
        where: { email: techData.email },
        defaults: techData
      });
      
      if (created) {
        console.log(`Created technician: ${tech.firstName} ${tech.lastName}`);
      }
    }

    // Get all offices and technicians
    const allOffices = await Office.findAll();
    const allTechnicians = await User.findAll({ where: { role: 'technician' } });

    // Create equipment for each office
    const equipmentTypes = ['Desktop PC', 'Laptop', 'Printer', 'Server', 'Network Switch', 'Router', 'Scanner', 'Projector'];
    const equipmentStatus = ['active', 'maintenance', 'repair'];
    
    for (const office of allOffices) {
      // Create 5-10 equipment items per office
      const numEquipment = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < numEquipment; i++) {
        const type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        const status = equipmentStatus[Math.floor(Math.random() * equipmentStatus.length)];
        const purchaseDate = new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 3)); // Random date within last 3 years
        const warrantyExpires = new Date(purchaseDate.getTime() + Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 2)); // Random warranty 0-2 years
        
        const equipment = await Equipment.create({
          name: `${type}-${office.name}-${i+1}`,
          type,
          status,
          serialNumber: `SN-${Math.floor(Math.random() * 10000)}`,
          purchaseDate,
          warrantyExpires,
          notes: `Sample ${type} for ${office.name}`,
          OfficeId: office.id
        });
        
        console.log(`Created equipment: ${equipment.name} for ${office.name}`);
      }
    }

    // Get all equipment
    const allEquipment = await Equipment.findAll();

    // Create tickets
    const ticketTitles = [
      'Computer not booting', 'Printer jam', 'Software installation required',
      'Network connectivity issues', 'Email not working', 'Screen flickering',
      'Keyboard not responding', 'System running slow', 'Data recovery needed',
      'Password reset required', 'Software update needed', 'Hardware upgrade request',
      'Virus detected', 'File access issues', 'Application crash'
    ];
    
    const ticketDescriptions = [
      'User reported that the device is not functioning properly.',
      'Urgent assistance needed to resolve this issue.',
      'This is affecting productivity and needs immediate attention.',
      'Scheduled maintenance required for this equipment.',
      'User needs help with configuring settings.',
      'Recurring issue that needs permanent resolution.',
      'New installation required for recent software update.',
      'Hardware component failure detected.',
      'System needs optimization for better performance.',
      'Security vulnerability needs to be patched.'
    ];
    
    const ticketStatuses = ['open', 'assigned', 'in_progress', 'on_hold', 'resolved'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const issueTypes = ['hardware', 'software', 'network', 'user_account', 'other'];
    
    // Create tickets for the past 3 months
    const currentDate = new Date();
    const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
    
    // Create 100-150 tickets
    const numTickets = Math.floor(Math.random() * 51) + 100;
    
    for (let i = 0; i < numTickets; i++) {
      const title = ticketTitles[Math.floor(Math.random() * ticketTitles.length)];
      const description = ticketDescriptions[Math.floor(Math.random() * ticketDescriptions.length)];
      const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      
      // Random equipment
      const equipment = allEquipment[Math.floor(Math.random() * allEquipment.length)];
      
      // Random technician (or null for unassigned)
      const assignRandomTech = Math.random() > 0.1; // 90% chance of assigning a technician
      const technician = assignRandomTech ? allTechnicians[Math.floor(Math.random() * allTechnicians.length)] : null;
      
      // Random date between 3 months ago and now
      const createdAt = new Date(threeMonthsAgo.getTime() + Math.random() * (currentDate.getTime() - threeMonthsAgo.getTime()));
      
      // For resolved tickets, add a resolved date
      let resolvedAt = null;
      if (status === 'resolved') {
        // Resolved date is between created date and now
        resolvedAt = new Date(createdAt.getTime() + Math.random() * (currentDate.getTime() - createdAt.getTime()));
      }
      
      const ticket = await Ticket.create({
        title,
        description,
        status,
        priority,
        issueType,
        createdAt,
        updatedAt: createdAt,
        resolvedAt,
        EquipmentId: equipment.id,
        UserId: technician ? technician.id : null
      });
      
      // Add 0-5 comments per ticket
      const numComments = Math.floor(Math.random() * 6);
      
      for (let j = 0; j < numComments; j++) {
        const commentDate = new Date(createdAt.getTime() + Math.random() * (currentDate.getTime() - createdAt.getTime()));
        const commentUser = allTechnicians[Math.floor(Math.random() * allTechnicians.length)];
        
        await Comment.create({
          content: `Comment ${j+1} on ticket: ${Math.random() > 0.5 ? 'Working on this issue.' : 'Update: making progress on resolution.'}`,
          createdAt: commentDate,
          updatedAt: commentDate,
          TicketId: ticket.id,
          UserId: commentUser.id
        });
      }
      
      console.log(`Created ticket #${ticket.id}: ${ticket.title} (${ticket.status})`);
    }

    console.log('Seed data for reports created successfully!');
  } catch (error) {
    console.error('Error seeding reports data:', error);
  } finally {
    await sequelize.close();
  }
}

seedReportsData(); 