const fs = require('fs');
const path = require('path');

// Path to the Font Awesome CSS file
const cssFilePath = path.join(__dirname, 'public', 'css', 'all.min.css');

// Read the CSS file
let cssContent = fs.readFileSync(cssFilePath, 'utf8');

// Replace the webfont paths
// Original path: ../webfonts/
// New path: /webfonts/
cssContent = cssContent.replace(/\.\.\/webfonts\//g, '/webfonts/');

// Write the updated content back to the file
fs.writeFileSync(cssFilePath, cssContent, 'utf8');

console.log('Font Awesome webfont paths fixed successfully!'); 