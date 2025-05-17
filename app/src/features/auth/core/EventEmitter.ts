'use client';

/**
 * EventEmitter.ts
 * 
 * Simple event emitter for internal event handling within the auth system.
 * Allows components to subscribe to and publish events without circular dependencies.
 */

type EventCallback = (data: any) => void;

export class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();
  
  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Function to call when event is triggered
   * @returns Unsubscribe function
   */
  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * Emit an event
   * @param event Event name
   * @param data Event data
   */
  public emit(event: string, data: any): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    // Make a copy of the listeners array to avoid issues with unsubscribing during emission
    const listeners = [...this.listeners.get(event)!];
    
    // Call each listener
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  
  /**
   * Get the number of listeners for an event
   * @param event Event name
   */
  public listenerCount(event: string): number {
    return this.listeners.has(event) ? this.listeners.get(event)!.length : 0;
  }
}
