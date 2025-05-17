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
        title: 'Success',
        description: 'Thank you for your inquiry! We will get back to you shortly.',
        variant: 'success'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while sending your request. Please try again later.',
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
          <h3 className="text-xl font-bold">Request sent!</h3>
          <p className="text-muted-foreground">
            Thank you for your inquiry. We have received your message and will get back to you shortly.
          </p>
          <Button 
            onClick={() => setIsSuccess(false)}
            className="mt-4"
          >
            New Form
          </Button>
        </div>
      </div>
    );
  }

  // No need for type conversion with explicit generic type

  return (
    <div className="bg-card rounded-lg p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
      
      <Form {...form as unknown as UseFormReturn<FieldValues>}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Email Address" type="email" {...field} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Phone Number (optional)" {...field} />
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
                <FormLabel>Desired Service *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Website Development">Website Development</SelectItem>
                    <SelectItem value="SEO Optimization">SEO Optimization</SelectItem>
                    <SelectItem value="Online Marketing">Online Marketing</SelectItem>
                    <SelectItem value="App Development">App Development</SelectItem>
                    <SelectItem value="IT Consulting">IT Consulting</SelectItem>
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
                <FormLabel>Message *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Your Message"
                    rows={5}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Please describe your request as precisely as possible
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
                Sending...
              </>
            ) : (
              'Send Request'
            )}  
          </Button>
        </form>
      </Form>
    </div>
  );
};
