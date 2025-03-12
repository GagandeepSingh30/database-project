const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const cssDir = path.join(__dirname, 'public', 'css');
const jsDir = path.join(__dirname, 'public', 'js');
const fontsDir = path.join(__dirname, 'public', 'webfonts');

// Ensure directories exist
[cssDir, jsDir, fontsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Copy Bootstrap CSS
fs.copyFileSync(
  path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css'),
  path.join(cssDir, 'bootstrap.min.css')
);
console.log('Copied Bootstrap CSS');

// Copy Bootstrap JS
fs.copyFileSync(
  path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js', 'bootstrap.bundle.min.js'),
  path.join(jsDir, 'bootstrap.bundle.min.js')
);
console.log('Copied Bootstrap JS');

// Copy jQuery
fs.copyFileSync(
  path.join(__dirname, 'node_modules', 'jquery', 'dist', 'jquery.min.js'),
  path.join(jsDir, 'jquery.min.js')
);
console.log('Copied jQuery');

// Copy Font Awesome CSS
fs.copyFileSync(
  path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free', 'css', 'all.min.css'),
  path.join(cssDir, 'all.min.css')
);
console.log('Copied Font Awesome CSS');

// Copy Font Awesome webfonts
const webfontsDir = path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts');
const webfonts = fs.readdirSync(webfontsDir);

webfonts.forEach(font => {
  fs.copyFileSync(
    path.join(webfontsDir, font),
    path.join(fontsDir, font)
  );
});
console.log(`Copied ${webfonts.length} Font Awesome webfonts`);

console.log('All assets copied successfully!'); 