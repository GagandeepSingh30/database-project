const db = require('./models');
const seedDatabase = require('./config/seed');

// Run the seeder
const runSeed = async () => {
  try {
    // Sync database (force: true will drop tables if they exist)
    await db.sequelize.sync({ force: true });
    console.log('Database synced successfully');

    // Run seed function
    await seedDatabase();
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

runSeed(); 