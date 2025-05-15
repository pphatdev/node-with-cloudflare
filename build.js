const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
    srcDir: './src',
    distDir: './dist',
    entry: './src/index.js', // Assuming your main file is index.js
    drizzleSchemaPath: './src/db/schema.js' // Adjust if your schema is elsewhere
};

// Ensure the dist directory exists
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Clean the dist directory
function cleanDist() {
    console.log('Cleaning dist directory...');
    if (fs.existsSync(config.distDir)) {
        fs.rmSync(config.distDir, { recursive: true, force: true });
    }
    ensureDirectoryExists(config.distDir);
}

// Copy necessary files to dist
function copyFiles() {
    console.log('Copying files...');

    // Copy your worker scripts
    if (fs.existsSync(config.srcDir)) {
        // Read all files from src recursively and copy to dist
        function copyRecursive(src, dest) {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = exists && stats.isDirectory();

            if (isDirectory) {
                ensureDirectoryExists(dest);
                fs.readdirSync(src).forEach(childItemName => {
                    copyRecursive(
                        path.join(src, childItemName),
                        path.join(dest, childItemName)
                    );
                });
            } else {
                // Only copy JS files, exclude test files
                if (src.endsWith('.js') && !src.includes('.test.js')) {
                    fs.copyFileSync(src, dest);
                }
            }
        }

        copyRecursive(config.srcDir, config.distDir);
    }

    // Copy package.json (for dependencies info)
    fs.copyFileSync('package.json', path.join(config.distDir, 'package.json'));
}

// Process Drizzle ORM schema if present
function processDrizzleSchema() {
    if (fs.existsSync(config.drizzleSchemaPath)) {
        console.log('Processing Drizzle schema...');
        try {
            // Ensure drizzle migrations directory exists
            ensureDirectoryExists('./migrations');

            // You might want to generate migrations here if needed
            // For example: execSync('npx drizzle-kit generate:sqlite');

            // Copy schema and migrations to dist
            if (fs.existsSync('./migrations')) {
                ensureDirectoryExists(path.join(config.distDir, 'migrations'));
                copyRecursive('./migrations', path.join(config.distDir, 'migrations'));
            }
        } catch (error) {
            console.error('Error processing Drizzle schema:', error);
        }
    }
}

// Main build function
async function build() {
    try {
        console.log('Starting build process...');

        // Run build steps
        cleanDist();
        copyFiles();
        processDrizzleSchema();

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Run the build
build();