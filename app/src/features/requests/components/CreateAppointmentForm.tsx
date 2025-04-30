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
import { useRequest } from '../hooks/useRequest';
import { RequestDetailResponseDto } from '@/domain/dtos/RequestDtos';
import { AppointmentService } from '@/features/appointments/lib/services/AppointmentService';
import { useToast } from '@/shared/hooks/useToast';
import { format, addDays } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  appointmentDate: z.string().min(1, 'Date is required'),
  appointmentTime: z.string().min(1, 'Time is required'),
  duration: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateAppointmentFormProps {
  request: RequestDetailResponseDto;
  onClose: () => void;
}

/**
 * Form for creating an appointment from a request
 */
export const CreateAppointmentForm: React.FC<CreateAppointmentFormProps> = ({
  request,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Default values
  const tomorrow = addDays(new Date(), 1);
  const defaultValues: Partial<FormValues> = {
    title: `Appointment with ${request.name}`,
    appointmentDate: format(tomorrow, 'yyyy-MM-dd'),
    appointmentTime: '10:00',
    duration: 60,
    location: 'Office',
    description: request.message || '',
    status: 'planned',
    note: '',
  };

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  /**
   * Direct approach to create the appointment through AppointmentService
   * This avoids the nested form issue by keeping form handling in one place
   */
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create appointment data object with proper date formatting
      const appointmentData = {
        title: data.title,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        duration: data.duration,
        location: data.location,
        description: data.description,
        status: data.status,
        // Include request and customer relationships
        requestId: request.id,
        customerId: request.customerId, // Pass along the customer ID if the request has one
        note: data.note
      };
      
      // Create appointment directly through AppointmentService
      const response = await AppointmentService.create(appointmentData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Appointment created successfully',
          variant: 'success'
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create appointment',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error as Error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form as any}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Appointment title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentTime"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Time *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Duration (minutes) *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Appointment location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description of the appointment"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The default status for new appointments is "Planned"
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Internal note about the appointment (optional)"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This note will be added as a comment to the request
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Appointment
          </Button>
        </div>
      </form>
    </Form>
  );
};
