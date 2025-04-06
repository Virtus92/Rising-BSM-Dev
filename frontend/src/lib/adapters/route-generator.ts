/**
 * API-Route-Generator für bestehende Controller
 * 
 * Diese Datei bietet Funktionen zum Generieren von NextJS-API-Routes
 * basierend auf bestehenden Express-Controllern.
 */
import { NextRequest, NextResponse } from 'next/server';
import { adaptController } from './express-to-next';
import container from '../core/DiContainer';
import { getLoggingService } from '../services/factory';

/**
 * Interface für Controller-Methoden
 */
export interface IControllerMethod {
  (req: any, res: any): void | Promise<void>;
}

/**
 * Typen von HTTP-Methoden
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Generiert eine NextJS-API-Route für eine Controller-Methode
 * 
 * @param controllerName Name des Controllers im DI-Container
 * @param methodName Name der Controller-Methode
 * @returns NextJS-API-Handler-Funktion
 */
export function generateRouteFromController(controllerName: string, methodName: string) {
  return async (req: NextRequest) => {
    const logger = getLoggingService();
    
    try {
      // Controller aus Container holen
      const controller = container.resolve(controllerName);
      
      if (!controller || typeof controller[methodName] !== 'function') {
        logger.error(`Controller ${controllerName} oder Methode ${methodName} nicht gefunden`);
        return NextResponse.json(
          { success: false, error: 'API-Methode nicht implementiert' },
          { status: 501 }
        );
      }
      
      // Controller-Methode adaptieren und ausführen
      const handler = adaptController(controller[methodName].bind(controller));
      return handler(req);
    } catch (error: any) {
      logger.error(`Fehler beim Aufrufen des Controllers ${controllerName}.${methodName}: ${error.message}`);
      
      return NextResponse.json(
        { success: false, error: 'Interner Serverfehler' },
        { status: 500 }
      );
    }
  };
}

/**
 * Generiert eine komplette Route-Handler-Map aus einem Controller
 * 
 * @param controllerName Name des Controllers im DI-Container
 * @param methodMap Mapping von HTTP-Methoden zu Controller-Methoden
 * @returns Objekt mit NextJS-API-Handler-Funktionen für jede HTTP-Methode
 */
export function generateRouteHandlers(
  controllerName: string, 
  methodMap: Record<HttpMethod, string>
) {
  const handlers: Record<string, any> = {};
  
  Object.entries(methodMap).forEach(([httpMethod, controllerMethod]) => {
    handlers[httpMethod] = generateRouteFromController(controllerName, controllerMethod);
  });
  
  return handlers;
}