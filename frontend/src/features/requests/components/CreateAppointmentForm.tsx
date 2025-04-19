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
import { AppointmentService } from '@/infrastructure/clients/AppointmentService';
import { useToast } from '@/shared/hooks/useToast';
import { format, addDays } from 'date-fns';
import { Loader2 } from 'lucide-react';

// Validierungsschema für das Formular
const formSchema = z.object({
  title: z.string().min(2, 'Titel muss mindestens 2 Zeichen haben'),
  appointmentDate: z.string().min(1, 'Datum ist erforderlich'),
  appointmentTime: z.string().min(1, 'Uhrzeit ist erforderlich'),
  duration: z.coerce.number().min(15, 'Dauer muss mindestens 15 Minuten sein'),
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
 * Formular zum Erstellen eines Termins für eine Kontaktanfrage
 */
export const CreateAppointmentForm: React.FC<CreateAppointmentFormProps> = ({
  request,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Default-Werte
  const tomorrow = addDays(new Date(), 1);
  const defaultValues: Partial<FormValues> = {
    title: `Termin mit ${request.name}`,
    appointmentDate: format(tomorrow, 'yyyy-MM-dd'),
    appointmentTime: '10:00',
    duration: 60,
    location: 'Büro',
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
      console.error('Error creating appointment:', error);
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel *</FormLabel>
              <FormControl>
                <Input placeholder="Termintitel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Datum *</FormLabel>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uhrzeit *</FormLabel>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dauer (Minuten) *</FormLabel>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ort</FormLabel>
                <FormControl>
                  <Input placeholder="Ort des Termins" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschreibung</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beschreibung des Termins"
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="planned">Geplant</SelectItem>
                  <SelectItem value="confirmed">Bestätigt</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                  <SelectItem value="cancelled">Abgesagt</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Der Standardstatus für neue Termine ist "Geplant"
              </FormDescription>
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
                  placeholder="Interne Notiz zum Termin (optional)"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Diese Notiz wird als Kommentar zur Anfrage hinzugefügt
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Termin erstellen
          </Button>
        </div>
      </form>
    </Form>
  );
};
