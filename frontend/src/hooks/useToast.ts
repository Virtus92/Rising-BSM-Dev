// Einfacher Toast-Hook ohne externe Abhängigkeiten
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'destructive';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
}

export function useToast() {
  const showToast = ({ 
    title, 
    description, 
    variant = 'info', 
    duration = 5000 
  }: ToastOptions) => {
    // In dieser vereinfachten Version verwenden wir console.log
    // In einer Produktionsumgebung würde hier eine richtige Toast-Komponente verwendet werden
    console.log(`[${variant.toUpperCase()}] ${title}${description ? ': ' + description : ''}`);
    
    // Falls wir in einem Browser-Umfeld sind, können wir die native alert-Funktion verwenden
    // Dies ist natürlich nur eine temporäre Lösung
    if (typeof window !== 'undefined') {
      const message = `${title}${description ? '\n' + description : ''}`;
      
      // Nur für Fehler zeigen wir ein alert an, um die Benutzererfahrung nicht zu stören
      if (variant === 'error' || variant === 'destructive') {
        setTimeout(() => {
          alert(message);
        }, 100);
      }
    }
  };

  return { toast: showToast };
}
