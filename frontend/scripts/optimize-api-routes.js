#!/usr/bin/env node

/**
 * API-Routes-Optimizer
 * 
 * Dieses Skript scannt alle API-Routes und aktualisiert sie, um den optimierten
 * API-Handler und die verbesserte DI-Container-Verwaltung zu verwenden.
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Farben für die Konsolenausgabe
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const API_ROUTES_DIR = path.resolve(process.cwd(), 'src/app/api');
const LOG_FILE = path.resolve(process.cwd(), 'api-routes-optimization.log');

/**
 * Prüft, ob eine Datei updatefähig ist
 */
function isFileOptimizable(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Prüfen, ob Datei imports vom DI-Container enthält
    const hasDIContainerImport = content.includes('import { container } from');
    
    // Prüfen, ob Datei schon optimiert ist
    const isAlreadyOptimized = content.includes('createApiHandler') || 
                             (content.includes('withAuth') && content.includes('services'));
    
    return hasDIContainerImport && !isAlreadyOptimized;
  } catch (error) {
    console.error(`${colors.red}Fehler beim Lesen von ${filePath}:${colors.reset}`, error);
    return false;
  }
}

/**
 * Findet alle API-Route-Dateien
 */
function findApiRouteFiles(dir) {
  let results = [];
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Rekursiv in Unterverzeichnisse
      results = results.concat(findApiRouteFiles(filePath));
    } else if (file === 'route.ts' || file === 'route.js') {
      // API-Route gefunden
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Extrahiert die Services aus einer Datei
 */
function extractRequiredServices(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const services = [];
    
    // Suche nach Zeilen wie: const authService = container.resolve<IAuthService>('AuthService');
    const regex = /container\.resolve<.*>\(['"]([^'"]+)['"]\)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      services.push(match[1]);
    }
    
    return [...new Set(services)]; // Duplikate entfernen
  } catch (error) {
    console.error(`${colors.red}Fehler beim Extrahieren von Services aus ${filePath}:${colors.reset}`, error);
    return [];
  }
}

/**
 * Formatiert einen Array von Services als String
 */
function formatServicesArray(services) {
  if (services.length === 0) {
    return '[]';
  }
  
  return `['${services.join("', '")}']`;
}

/**
 * Aktualisiert eine API-Route-Datei
 */
function updateApiRouteFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const requiredServices = extractRequiredServices(filePath);
    
    // Import-Anweisungen aktualisieren
    if (content.includes('import { container } from')) {
      content = content.replace(
        /import { container } from ['"](.*?)['"];/,
        `// import { container } from '$1'; // Durch optimierten API-Handler ersetzt`
      );
    }
    
    // Prüfen, ob withAuth bereits importiert wird
    if (content.includes('import { withAuth }')) {
      // withAuth-Import erweitern oder createApiHandler hinzufügen
      if (!content.includes('createApiHandler')) {
        content = content.replace(
          /import { withAuth } from ['"](.*?)['"];/,
          `import { withAuth, createApiHandler } from '$1';`
        );
      }
    } else if (content.includes('withAuth(')) {
      // withAuth hinzufügen, wenn nicht importiert aber verwendet
      content = content.replace(
        /import (.*?) from ['"]@\/lib\/server\/core\/auth['"];/,
        `import { withAuth, createApiHandler, $1 } from '@/lib/server/core/auth';`
      );
    } else if (content.includes('from \'@/lib/server/core/auth\'')) {
      // createApiHandler zu bestehenden auth-Imports hinzufügen
      content = content.replace(
        /import (.*?) from ['"]@\/lib\/server\/core\/auth['"];/,
        `import { createApiHandler, $1 } from '@/lib/server/core/auth';`
      );
    } else {
      // createApiHandler-Import hinzufügen
      content = content.replace(
        /import (.*?) from ['"]next\/server['"];/,
        `import $1 from 'next/server';\nimport { createApiHandler } from '@/lib/server/core/api-handler';`
      );
    }
    
    // Import für ILoggingService hinzufügen, falls nicht vorhanden
    if (!content.includes('ILoggingService')) {
      content = content.replace(
        /import (.*?) from ['"]@\/lib\/server\/interfaces\/(.*?)['"];/,
        `import $1 from '@/lib/server/interfaces/$2';\nimport { ILoggingService } from '@/lib/server/interfaces/ILoggingService';`
      );
    }
    
    // Konstante für Services hinzufügen
    if (requiredServices.length > 0 && !content.includes('SERVICES_TO_RESOLVE')) {
      const servicesConstant = `\n// Dienste, die für diese Route aufgelöst werden sollen\nconst SERVICES_TO_RESOLVE = ${formatServicesArray(requiredServices)};\n`;
      
      // Nach den Imports einfügen
      const lastImportIndex = content.lastIndexOf('import');
      const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
      
      content = content.substring(0, lastImportLineEnd + 1) + 
                servicesConstant + 
                content.substring(lastImportLineEnd + 1);
    }
    
    // Routes aktualisieren
    // 1. Suche nach Funktionen wie: export const GET = withAuth(async (req, user) => { ... });
    const routeRegex = /export const ([A-Z]+) = withAuth\((async)?\s*\((req[^)]*?)(?:,\s*user)?\)\s*=>\s*{/g;
    content = content.replace(routeRegex, (match, method, isAsync, reqParam) => {
      return `export const ${method} = withAuth(\n  ${isAsync || 'async'} (${reqParam}, user, services) => {`;
    });
    
    // 2. Direkte Zugriffe auf container.resolve ersetzen
    for (const service of requiredServices) {
      const serviceRegex = new RegExp(`const (\\w+) = container\\.resolve<[^>]*>\\(['"]${service}['"]\\);`, 'g');
      content = content.replace(serviceRegex, (match, varName) => {
        return `// ${match} // Durch optimierten API-Handler ersetzt`;
      });
    }
    
    // 3. Service-Extraktion am Anfang des Handlers hinzufügen
    const handlerRegex = /(export const [A-Z]+ = withAuth\(\n\s+async \([^{]*\) => {)(\s+)/g;
    content = content.replace(handlerRegex, (match, handlerStart, indent) => {
      if (requiredServices.length > 0) {
        return `${handlerStart}${indent}const { logger, ${requiredServices.join(', ')} } = services as {\n${indent}  logger: ILoggingService;\n${requiredServices.map(s => `${indent}  ${s}: I${s.replace(/Service$/, '')}Service`).join(';\n')};\n${indent}};${indent}`;
      }
      return match;
    });
    
    // 4. SERVICES_TO_RESOLVE als Parameter zu withAuth hinzufügen
    const withAuthRegex = /(export const [A-Z]+ = withAuth\()([^)]*\))/g;
    content = content.replace(withAuthRegex, (match, start, params) => {
      // Prüfen, ob bereits ein SERVICES_TO_RESOLVE Parameter vorhanden ist
      if (params.includes('SERVICES_TO_RESOLVE')) {
        return match;
      }
      return `${start}${params},\n  SERVICES_TO_RESOLVE`;
    });
    
    // Datei aktualisieren
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`${colors.red}Fehler beim Aktualisieren von ${filePath}:${colors.reset}`, error);
    return false;
  }
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}=== API-Routes Optimizer ===${colors.reset}`);
  console.log(`${colors.yellow}Suche nach API-Routes in:${colors.reset} ${API_ROUTES_DIR}`);
  
  // Log-Datei initialisieren
  fs.writeFileSync(LOG_FILE, `API Routes Optimization - ${new Date().toISOString()}\n\n`, 'utf8');
  
  // Alle API-Route-Dateien finden
  const routeFiles = findApiRouteFiles(API_ROUTES_DIR);
  console.log(`${colors.green}${routeFiles.length} API-Route-Dateien gefunden.${colors.reset}`);
  
  // Optimierbare Dateien filtern
  const optimizableFiles = routeFiles.filter(isFileOptimizable);
  console.log(`${colors.yellow}${optimizableFiles.length} davon sind optimierbar.${colors.reset}`);
  
  // Dateien aktualisieren
  let successCount = 0;
  for (const filePath of optimizableFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    process.stdout.write(`${colors.yellow}Optimiere ${relativePath}...${colors.reset} `);
    
    if (updateApiRouteFile(filePath)) {
      process.stdout.write(`${colors.green}OK${colors.reset}\n`);
      successCount++;
      
      // In Log-Datei protokollieren
      fs.appendFileSync(LOG_FILE, `✅ Optimiert: ${relativePath}\n`);
    } else {
      process.stdout.write(`${colors.red}FEHLER${colors.reset}\n`);
      
      // In Log-Datei protokollieren
      fs.appendFileSync(LOG_FILE, `❌ Fehler: ${relativePath}\n`);
    }
  }
  
  console.log(`\n${colors.bright}${colors.green}Optimierung abgeschlossen:${colors.reset}`);
  console.log(`${colors.green}- ${successCount} von ${optimizableFiles.length} Dateien erfolgreich optimiert${colors.reset}`);
  console.log(`${colors.blue}- Log-Datei: ${LOG_FILE}${colors.reset}`);
  
  // Hinweis zur manuellen Überprüfung
  console.log(`\n${colors.yellow}Hinweis: Bitte überprüfen Sie die optimierten Dateien manuell auf korrekte Funktionalität.${colors.reset}`);
}

// Ausführen
main().catch(error => {
  console.error(`${colors.red}Unbehandelter Fehler:${colors.reset}`, error);
  process.exit(1);
});
