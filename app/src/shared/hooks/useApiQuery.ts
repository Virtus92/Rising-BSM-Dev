/**
 * Hook für einheitliche API-Abfragen mit React Query
 * 
 * Kombiniert die Leistung von React Query mit standardisierter
 * Fehlerbehandlung und Toast-Benachrichtigungen.
 */
import { 
  useQuery, 
  useMutation, 
  UseQueryOptions, 
  UseMutationOptions,
  QueryClient
} from '@tanstack/react-query';
import { ApiResponse } from '@/core/api/ApiClient';
import { useToast } from './useToast';
import { useErrorHandler } from '@/shared/utils/errorHandler';
import { processApiResponse } from '@/shared/utils/apiUtils';

type ApiQueryFn<TData> = (...args: any[]) => Promise<ApiResponse<TData>>;
type ApiQueryOptions<TData, TError> = Omit<
  UseQueryOptions<TData, TError, TData, any[]>,
  'queryFn'
> & {
  showErrorToast?: boolean;
  errorToastTitle?: string;
};

type ApiMutationOptions<TData, TVariables, TError> = Omit<
  UseMutationOptions<TData, TError, TVariables, any>,
  'mutationFn'
> & {
  showSuccessToast?: boolean;
  successToastTitle?: string;
  successToastMessage?: string;
  showErrorToast?: boolean;
  errorToastTitle?: string;
};

/**
 * Hook für API-Abfragen mit einheitlicher Fehlerbehandlung
 */
export function useApiQuery<TData = unknown, TError = Error>(
  apiQueryFn: ApiQueryFn<TData>,
  queryKey: readonly unknown[],
  options: Partial<ApiQueryOptions<TData, TError>> = {}
) {
  const { 
    showErrorToast = true, 
    errorToastTitle = 'Fehler',
    ...queryOptions 
  } = options;
  
  const { handleError } = useErrorHandler();
  
  // Wrappern Sie die API-Funktion, um Fehler zu behandeln und Daten zu extrahieren
  const enhancedQueryFn = async (...args: any[]) => {
    try {
      return await processApiResponse<TData>(
        apiQueryFn(...args),
        { context: `query:${queryKey[0]}` }
      );
    } catch (error) {
      if (showErrorToast) {
        handleError(error, { title: errorToastTitle });
      }
      throw error;
    }
  };
  
  return useQuery<TData, TError>({
    queryKey,
    queryFn: enhancedQueryFn,
    ...queryOptions as any
  });
}

/**
 * Hook für API-Mutationen mit einheitlicher Fehlerbehandlung
 */
export function useApiMutation<TData = unknown, TVariables = unknown, TError = Error>(
  apiMutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: ApiMutationOptions<TData, TVariables, TError> = {}
) {
  const { 
    showSuccessToast = false,
    successToastTitle = 'Erfolg',
    successToastMessage = 'Der Vorgang wurde erfolgreich abgeschlossen.',
    showErrorToast = true, 
    errorToastTitle = 'Fehler',
    ...mutationOptions 
  } = options;
  
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  
  // Wrap der API-Funktion für Fehlerbehandlung und Datenextraktion
  const enhancedMutationFn = async (variables: TVariables) => {
    try {
      return await processApiResponse<TData>(
        apiMutationFn(variables),
        { context: 'mutation' }
      );
    } catch (error) {
      if (showErrorToast) {
        handleError(error, { title: errorToastTitle });
      }
      throw error;
    }
  };
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: enhancedMutationFn,
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      // Bei Erfolg Toast anzeigen, falls aktiviert
      if (showSuccessToast) {
        toast({
          title: successToastTitle,
          description: successToastMessage,
          variant: 'success'
        });
      }
      
      // Original onSuccess ausführen, falls vorhanden
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(data, variables, context);
      }
    }
  });
}

/**
 * Invalidiert einen oder mehrere Query-Caches nach einer erfolgreichen Mutation
 */
export function invalidateQueries(
  queryClient: QueryClient,
  queryKeys: string | string[]
): void {
  const keys = Array.isArray(queryKeys) ? queryKeys : [queryKeys];
  
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}

/**
 * Hilfsfunktion zum Erstellen von optimistischen Updates
 */
export function createOptimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  queryKey: any[],
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Ausstehende Abfragen pausieren, um Race Conditions zu vermeiden
      await queryClient.cancelQueries({ queryKey });
      
      // Vorherige Daten speichern
      const previousData = queryClient.getQueryData<TData>(queryKey);
      
      // Daten optimistisch aktualisieren
      queryClient.setQueryData<TData>(queryKey, old => updateFn(old, variables));
      
      // Kontext für Rollback zurückgeben
      return { previousData };
    },
    
    onError: (_: unknown, __: TVariables, context: any) => {
      // Bei Fehler zurückrollen
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    
    onSettled: () => {
      // Abfrage für aktuelle Daten neu laden
      queryClient.invalidateQueries({ queryKey });
    }
  };
}
