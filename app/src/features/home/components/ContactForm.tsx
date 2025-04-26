import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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

// Validierungsschema für das Formular
const formSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  phone: z.string().optional(),
  service: z.string({
    required_error: 'Bitte wählen Sie einen Service aus',
  }),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen haben'),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Komponente für das Kontaktformular auf der öffentlichen Website
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
        title: 'Erfolg',
        description: 'Vielen Dank für Ihre Anfrage! Wir werden uns in Kürze bei Ihnen melden.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Beim Senden Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
        variant: 'error'
      });
      console.error('Error submitting contact form:', error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wenn das Formular erfolgreich abgeschickt wurde, zeige eine Erfolgsmeldung
  if (isSuccess) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-md">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-xl font-bold">Anfrage gesendet!</h3>
          <p className="text-muted-foreground">
            Vielen Dank für Ihre Anfrage. Wir haben Ihre Nachricht erhalten und werden uns in Kürze bei Ihnen melden.
          </p>
          <Button 
            onClick={() => setIsSuccess(false)}
            className="mt-4"
          >
            Neues Formular
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-6">Kontaktieren Sie uns</h2>
      
      <Form {...form as any} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
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
                    <Input placeholder="Ihre E-Mail-Adresse" type="email" {...field} />
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
                <FormLabel>Gewünschter Service *</FormLabel>
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
                    <SelectItem value="Website-Entwicklung">Website-Entwicklung</SelectItem>
                    <SelectItem value="SEO-Optimierung">SEO-Optimierung</SelectItem>
                    <SelectItem value="Online-Marketing">Online-Marketing</SelectItem>
                    <SelectItem value="App-Entwicklung">App-Entwicklung</SelectItem>
                    <SelectItem value="IT-Beratung">IT-Beratung</SelectItem>
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
                    placeholder="Ihre Nachricht an uns"
                    rows={5}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Bitte beschreiben Sie Ihr Anliegen so genau wie möglich
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
            </div>
            </Form>
    </div>
  );
};
