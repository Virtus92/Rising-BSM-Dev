import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const swaggerJsonPath = path.join(distDir, 'swagger.json');

// Stelle sicher, dass das dist-Verzeichnis existiert
if (!fs.existsSync(distDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distDir, { recursive: true });
}

// Prüfe, ob swagger.json existiert
if (!fs.existsSync(swaggerJsonPath)) {
  console.log('No swagger.json found. Generating...');
  
  try {
    // Führe das Bundle-Skript aus
    const bundleScript = path.join(rootDir, 'scripts', 'bundle-openapi.js');
    exec(`node ${bundleScript}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error generating swagger.json:', error);
        console.error(stderr);
        process.exit(1);
      }
      
      console.log(stdout);
      console.log('swagger.json generated successfully!');
    });
  } catch (error) {
    console.error('Failed to execute OpenAPI bundling:', error);
    process.exit(1);
  }
} else {
  console.log('swagger.json already exists.');
}