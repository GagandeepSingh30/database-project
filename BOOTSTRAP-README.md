# Local Bootstrap, jQuery, and Font Awesome Setup

This project uses local copies of Bootstrap, jQuery, and Font Awesome instead of CDN links to ensure consistent availability and performance.

## Installed Packages

- Bootstrap v5.3.2
- jQuery v3.7.1
- Font Awesome v6.4.2

## File Structure

The assets are organized as follows:

```
public/
├── css/
│   ├── bootstrap.min.css
│   ├── all.min.css (Font Awesome)
│   └── style.css (Custom styles)
├── js/
│   ├── bootstrap.bundle.min.js
│   ├── jquery.min.js
│   └── main.js (Custom scripts)
└── webfonts/
    └── [Font Awesome webfonts]
```

## How to Update

If you need to update the packages, you can use the following npm scripts:

1. To copy the assets from node_modules to the public directory:
   ```
   npm run copy-assets
   ```

2. To update the npm packages and copy the assets:
   ```
   npm run update-assets
   ```

## Troubleshooting

If you encounter any issues with the assets:

1. Make sure the packages are installed:
   ```
   npm install bootstrap@5.3.2 jquery@3.7.1 @fortawesome/fontawesome-free@6.4.2 --save
   ```

2. Run the copy-assets script:
   ```
   npm run copy-assets
   ```

3. Check the browser console for any 404 errors related to the assets.

4. Verify that the paths in layout.ejs are correct:
   ```html
   <link rel="stylesheet" href="/css/bootstrap.min.css">
   <link rel="stylesheet" href="/css/all.min.css">
   <script src="/js/jquery.min.js"></script>
   <script src="/js/bootstrap.bundle.min.js"></script>
   ```

## Manual Installation

If the npm scripts don't work, you can manually copy the files:

1. Copy `node_modules/bootstrap/dist/css/bootstrap.min.css` to `public/css/`
2. Copy `node_modules/bootstrap/dist/js/bootstrap.bundle.min.js` to `public/js/`
3. Copy `node_modules/jquery/dist/jquery.min.js` to `public/js/`
4. Copy `node_modules/@fortawesome/fontawesome-free/css/all.min.css` to `public/css/`
5. Copy all files from `node_modules/@fortawesome/fontawesome-free/webfonts/` to `public/webfonts/`
6. Edit `public/css/all.min.css` to replace `../webfonts/` with `/webfonts/` 