'use client';

import { useState, useCallback } from 'react';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentDto } from '@/domain/dtos/AppointmentDtos';
import { AppointmentStatus } from '@/domain/enums/CommonEnums';
import { format } from 'date-fns';

interface UseAppointmentFormProps {
  initialData?: Partial<AppointmentDto>;
  onSubmit: (data: CreateAppointmentDto | UpdateAppointmentDto) => Promise<any>;
}

interface UseAppointmentFormResult {
  title: string;
  setTitle: (value: string) => void;
  appointmentDate: string;
  setAppointmentDate: (value: string) => void;
  appointmentTime: string;
  setAppointmentTime: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  location: string;
  setLocation: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  status: AppointmentStatus;
  setStatus: (value: AppointmentStatus) => void;
  customerId: number | undefined;
  setCustomerId: (value: number | undefined) => void;
  service: string;
  setService: (value: string) => void;
  errors: Record<string, string>;
  submitting: boolean;
  handleSubmit: () => Promise<void>;
  updateField: (field: string, value: any) => void;
}

export function useAppointmentForm({
  initialData,
  onSubmit
}: UseAppointmentFormProps): UseAppointmentFormResult {
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [appointmentDate, setAppointmentDate] = useState(
    initialData?.appointmentDate 
      ? (typeof initialData.appointmentDate === 'string' 
          ? initialData.appointmentDate.split('T')[0] 
          : format(new Date(initialData.appointmentDate), 'yyyy-MM-dd'))
      : format(new Date(), 'yyyy-MM-dd')
  );
  const [appointmentTime, setAppointmentTime] = useState(initialData?.appointmentTime || format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState(initialData?.duration || 60);
  const [location, setLocation] = useState(initialData?.location || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<AppointmentStatus>(initialData?.status as AppointmentStatus || AppointmentStatus.PLANNED);
  const [customerId, setCustomerId] = useState<number | undefined>(initialData?.customerId);
  const [service, setService] = useState(initialData?.service || '');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }
    
    // Date validation
    if (!appointmentDate) {
      newErrors.appointmentDate = 'Date is required';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentDate)) {
        newErrors.appointmentDate = 'Invalid date format';
      }
    }
    
    // Time validation
    if (!appointmentTime) {
      newErrors.appointmentTime = 'Time is required';
    } else {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(appointmentTime)) {
        newErrors.appointmentTime = 'Invalid time format';
      }
    }
    
    // Duration validation
    if (!duration) {
      newErrors.duration = 'Duration is required';
    } else if (duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    } else if (duration > 480) {
      newErrors.duration = 'Duration cannot exceed 8 hours';
    }
    
    // Description validation
    if (description && description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }
    
    // Location validation
    if (location && location.length > 200) {
      newErrors.location = 'Location cannot exceed 200 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, appointmentDate, appointmentTime, duration, description, location]);

  // Update field and clear errors
  const updateField = useCallback((field: string, value: any) => {
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'appointmentDate':
        setAppointmentDate(value);
        break;
      case 'appointmentTime':
        setAppointmentTime(value);
        break;
      case 'duration':
        setDuration(value);
        break;
      case 'location':
        setLocation(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'status':
        setStatus(value);
        break;
      case 'customerId':
        setCustomerId(value);
        break;
      case 'service':
        setService(value);
        break;
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setErrors({});
    
    try {
      const formData: CreateAppointmentDto | UpdateAppointmentDto = {
        title: title.trim(),
        appointmentDate: appointmentDate.trim(),
        appointmentTime: appointmentTime.trim(),
        duration: Number(duration),
        location: location.trim(),
        description: description.trim(),
        status,
        customerId,
        service: service.trim()
      };
      
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting appointment form:', error);
      setErrors({ general: 'Failed to save appointment. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }, [
    title, appointmentDate, appointmentTime, duration, location,
    description, status, customerId, service, validateForm, onSubmit
  ]);

  return {
    title,
    setTitle,
    appointmentDate,
    setAppointmentDate,
    appointmentTime,
    setAppointmentTime,
    duration,
    setDuration,
    location,
    setLocation,
    description,
    setDescription,
    status,
    setStatus,
    customerId,
    setCustomerId,
    service,
    setService,
    errors,
    submitting,
    handleSubmit,
    updateField
  };
}
