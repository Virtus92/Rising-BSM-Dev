/**
 * Script zum Aktualisieren aller API-Routen auf das neue Pattern
 * mit Früh-Initialisierung des DI-Containers
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Pfad zum API-Verzeichnis
const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');
// Pfad zur Log-Datei
const LOG_FILE = path.join(__dirname, 'api-routes-update.log');

// Muster zum Erkennen von Files, die aktualisiert werden müssen
const ROUTE_FILE_PATTERN = /route\.(ts|js)$/;
// Muster zum Erkennen von Imports
const IMPORT_PATTERN = /^import/m;
// Serverinitialisierungs-Import
const SERVER_INIT_IMPORT = "// Serverinitialisierung zuerst importieren\nimport '@/lib/server/init';\n\n";

/**
 * Aktualisiert eine einzelne API-Route
 */
async function updateApiRoute(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Prüfen, ob die Datei bereits den neuen Import enthält
    if (content.includes("'@/lib/server/init'")) {
      return { updated: false, message: 'Route bereits auf dem neuesten Stand' };
    }
    
    // Einfügen des Imports am Anfang der Datei
    let updatedContent;
    if (content.match(IMPORT_PATTERN)) {
      updatedContent = SERVER_INIT_IMPORT + content;
    } else {
      updatedContent = SERVER_INIT_IMPORT + content;
    }
    
    // Aktualisierte Datei schreiben
    await writeFile(filePath, updatedContent);
    
    return { updated: true, message: 'Route erfolgreich aktualisiert' };
  } catch (error) {
    return { 
      updated: false, 
      error: true, 
      message: `Fehler beim Aktualisieren: ${error.message}` 
    };
  }
}

/**
 * Findet alle API-Routen in einem Verzeichnis (rekursiv)
 */
async function findApiRoutes(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  const files = entries
    .filter(entry => entry.isFile() && entry.name.match(ROUTE_FILE_PATTERN))
    .map(entry => path.join(dir, entry.name));
  
  const dirs = entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dir, entry.name));
  
  const routesInSubDirs = await Promise.all(
    dirs.map(subDir => findApiRoutes(subDir))
  );
  
  return [...files, ...routesInSubDirs.flat()];
}

/**
 * Hauptfunktion
 */
async function main() {
  try {
    console.log('Suche nach API-Routen...');
    
    // Alle API-Routen finden
    const apiRoutes = await findApiRoutes(API_DIR);
    console.log(`${apiRoutes.length} API-Routen gefunden.`);
    
    // Ergebnisse protokollieren
    const results = [];
    
    // Alle Routen aktualisieren
    for (const routePath of apiRoutes) {
      console.log(`Aktualisiere: ${routePath}`);
      const result = await updateApiRoute(routePath);
      results.push({
        path: routePath,
        ...result
      });
    }
    
    // Ergebnisse in Log-Datei schreiben
    const logContent = results
      .map(r => `${r.updated ? '[UPDATED]' : r.error ? '[ERROR]' : '[SKIPPED]'} ${r.path}: ${r.message}`)
      .join('\n');
    
    await writeFile(LOG_FILE, logContent);
    
    // Statistiken ausgeben
    const updated = results.filter(r => r.updated).length;
    const errors = results.filter(r => r.error).length;
    const skipped = results.filter(r => !r.updated && !r.error).length;
    
    console.log('\nUpdate abgeschlossen:');
    console.log(`- ${updated} Routen aktualisiert`);
    console.log(`- ${skipped} Routen übersprungen (bereits aktuell)`);
    console.log(`- ${errors} Fehler aufgetreten`);
    console.log(`\nLog-Datei wurde erstellt: ${LOG_FILE}`);
    
  } catch (error) {
    console.error('Fehler beim Aktualisieren der API-Routen:', error);
    process.exit(1);
  }
}

// Ausführen des Scripts
main();
