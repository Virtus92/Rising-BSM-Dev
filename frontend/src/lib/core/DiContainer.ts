/**
 * Vereinfachter Dependency Injection Container für NextJS
 * 
 * Diese Version ist speziell für NextJS optimiert und nutzt ein einfacheres
 * Singleton-Pattern für die Verwaltung von Abhängigkeiten.
 */

// Factory-Typen
export type Factory<T> = () => T;

// Optionen für die Registrierung
export interface RegistrationOptions {
  singleton?: boolean;
}

/**
 * Dependency Injection Container
 */
export class DiContainer {
  private instances: Map<string, any> = new Map();
  private factories: Map<string, Factory<any>> = new Map();
  private singletons: Set<string> = new Set();

  /**
   * Einen Dienst registrieren
   * 
   * @param name Name des Dienstes
   * @param factory Factory-Funktion
   * @param options Optionen für die Registrierung
   */
  register<T>(name: string, factory: Factory<T>, options: RegistrationOptions = {}): void {
    this.factories.set(name, factory);
    
    if (options.singleton) {
      this.singletons.add(name);
    }
  }

  /**
   * Einen Dienst auflösen
   * 
   * @param name Name des Dienstes
   * @returns Instanz des Dienstes
   */
  resolve<T>(name: string): T {
    // Überprüfen, ob bereits eine Instanz existiert (für Singletons)
    if (this.singletons.has(name) && this.instances.has(name)) {
      return this.instances.get(name) as T;
    }
    
    // Factory auflösen
    const factory = this.factories.get(name);
    
    if (!factory) {
      throw new Error(`Dienst ${name} ist nicht registriert`);
    }
    
    // Instanz erstellen
    const instance = factory();
    
    // Speichern, falls es sich um einen Singleton handelt
    if (this.singletons.has(name)) {
      this.instances.set(name, instance);
    }
    
    return instance as T;
  }

  /**
   * Überprüfen, ob ein Dienst registriert ist
   * 
   * @param name Name des Dienstes
   * @returns True, wenn der Dienst registriert ist
   */
  has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Alle registrierten Dienste auflisten
   * 
   * @returns Array mit den Namen aller registrierten Dienste
   */
  listRegistrations(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Container zurücksetzen
   */
  reset(): void {
    this.instances.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

/**
 * Factory-Erzeuger für die Verwendung mit dem DI-Container (Kompatibilitätsmodus)
 */
export function createFactory<T>(factory: Factory<T>): Factory<T> {
  return factory;
}

// Singleton-Container-Instanz
const container = new DiContainer();

export default container;
