import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/core/api/ApiClient';
import { CustomerClient } from '@/features/customers/lib/clients/CustomerClient';
import { RequestClient } from '@/features/requests/lib/clients/RequestClient';
import { useToast } from '@/shared/hooks/useToast';
import { Loader2, Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

// Validierungsschema für das Formular
const formSchema = z.object({
  customerId: z.number({
    required_error: 'Sie müssen einen Kunden auswählen',
  }),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LinkToCustomerFormProps {
  requestId: number;
  onClose: () => void;
}

/**
 * Formular zum Verknüpfen einer Kontaktanfrage mit einem bestehenden Kunden
 */
export const LinkToCustomerForm: React.FC<LinkToCustomerFormProps> = ({
  requestId,
  onClose,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Kundensuche
  // Use the static method directly
  // const apiClient = new ApiClient();
  // const customerClient = new CustomerClient(apiClient);
  
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => CustomerClient.getCustomers({ search: searchQuery, limit: 10 }),
    enabled: searchQuery.length > 0,
  });

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: '',
    },
  });

  const selectedCustomerId = form.watch('customerId');
  
  // Handle the new PaginationResult structure that has data array instead of direct access
  const selectedCustomer = customers?.data?.data?.find(
    (customer: any) => customer.id === selectedCustomerId
  );

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLinking(true);
      const response = await RequestClient.linkToCustomer(requestId, data.customerId, data.note);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Request successfully linked to customer",
          variant: "success"
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to link customer",
          variant: "error"
        });
      }
    } catch (error) {
      console.error("Error linking customer:", error as Error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "error"
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Form {...form as any}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Kunde</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? selectedCustomer
                          ? selectedCustomer.name
                          : "Kunde auswählen"
                        : "Kunde auswählen"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Kunden suchen..." 
                      onValueChange={setSearchQuery}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoadingCustomers ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Suche...
                          </div>
                        ) : (
                          "Keine Kunden gefunden."
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {customers?.data?.data?.map((customer: any) => (
                          <CommandItem
                            value={customer.name || `customer-${customer.id}`}
                            key={customer.id}
                            onSelect={() => {
                              form.setValue("customerId", customer.id);
                              setOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              {customer.email && (
                                <span className="text-xs text-muted-foreground">
                                  {customer.email}
                                </span>
                              )}
                            </div>
                            <CheckIcon
                              className={cn(
                                "ml-auto h-4 w-4",
                                customer.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notiz</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notiz zur Verknüpfung (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLinking || !selectedCustomerId}>
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mit Kunde verknüpfen
          </Button>
        </div>
      </form>
    </Form>
  );
};
