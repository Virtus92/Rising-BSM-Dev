/**
 * Type definitions for React Hook Form components
 * Ensures components have proper type checking for form handling
 */
import { 
  UseFormReturn, 
  FieldValues,
  UseFormProps,
  SubmitHandler,
  SubmitErrorHandler,
  UseFormWatch
} from 'react-hook-form';

// Type definition for React Hook Form context
export interface FormContextType<FormValues extends FieldValues> {
  form: UseFormReturn<FormValues>;
}

// Interface for form props used in ContactForm and other form components
export interface FormComponentProps<TFieldValues extends FieldValues> {
  onSubmit: SubmitHandler<TFieldValues>;
  onError?: SubmitErrorHandler<TFieldValues>;
  defaultValues?: Partial<TFieldValues>;
  formOptions?: UseFormProps<TFieldValues>;
  children?: React.ReactNode;
  watch?: UseFormWatch<TFieldValues>;
}

// Define a UseFromSubscribe type for compatibility with useForm return values
export type UseFromSubscribe<T> = (name: string, callback: (value: T) => void) => void;
