const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Updating npm packages...');
try {
  // Update npm packages
  execSync('npm update bootstrap jquery @fortawesome/fontawesome-free', { stdio: 'inherit' });
  
  console.log('\nCopying updated assets...');
  // Run the copy-assets script
  execSync('npm run copy-assets', { stdio: 'inherit' });
  
  console.log('\nAssets updated successfully!');
} catch (error) {
  console.error('Error updating assets:', error.message);
  process.exit(1);
} 