import React, { useState } from 'react';
import { useForm, FieldValues, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useToast } from '@/shared/hooks/useToast';
import ApiClient from '@/core/api/ApiClient';
import { CreateRequestDto } from '@/domain/dtos/RequestDtos';
import { Loader2, CheckCircle2 } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  email: z.string().email('Valid email address required'),
  phone: z.string().optional(),
  service: z.string({
    required_error: 'Please select a service',
  }),
  message: z.string().min(10, 'Message must have at least 10 characters'),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Contact form component for the public website
 */
export const ContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      service: '',
      message: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Initialize the API client with the correct base URL
      await ApiClient.initialize();
      
      // Use ApiClient directly since it's now a static class
      const requestData: CreateRequestDto = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        service: data.service,
        message: data.message,
      };
      
      // Use ApiClient post method directly with the correct endpoint
      // Note: Don't include /api in the URL as it's already included in the base URL
      const response = await ApiClient.post('/requests/public', requestData);
      
      setIsSuccess(true);
      form.reset();
      
      toast({
        title: 'Erfolgreich gesendet',
        description: 'Vielen Dank für Ihre Anfrage! Wir melden uns in Kürze bei Ihnen.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        variant: 'error'
      });
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the form has been successfully submitted, show a success message
  if (isSuccess) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-md">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-xl font-bold">Anfrage gesendet!</h3>
          <p className="text-muted-foreground">
            Vielen Dank für Ihre Anfrage. Wir haben Ihre Nachricht erhalten und melden uns in Kürze bei Ihnen.
          </p>
          <Button 
            onClick={() => setIsSuccess(false)}
            className="mt-4"
          >
            Neue Anfrage
          </Button>
        </div>
      </div>
    );
  }

  // No need for type conversion with explicit generic type

  return (
    <div className="bg-card rounded-lg p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-6">Kontakt aufnehmen</h2>
      
      <Form {...form as unknown as UseFormReturn<FieldValues>}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Ihr Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ihre E-Mail Adresse" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="Ihre Telefonnummer (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gewünschte Dienstleistung *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Service auswählen" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Winterdienst">Winterdienst & Streudienst</SelectItem>
                    <SelectItem value="Gruenflaechen">Grünflächenpflege</SelectItem>
                    <SelectItem value="Reinigung">Reinigungsservice</SelectItem>
                    <SelectItem value="Hausbetreuung">Hausbetreuung</SelectItem>
                    <SelectItem value="Umzug">Umzugsservice</SelectItem>
                    <SelectItem value="Montage">Montage & Zusammenbau</SelectItem>
                    <SelectItem value="Entruempelung">Entrümpelung</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachricht *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Ihre Nachricht"
                    rows={5}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Bitte beschreiben Sie Ihre Anfrage so genau wie möglich
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              'Anfrage senden'
            )}  
          </Button>
        </form>
      </Form>
    </div>
  );
};
