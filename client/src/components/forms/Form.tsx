import React from 'react';
import { useForm, Controller, SubmitHandler, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormProps<T extends FieldValues> {
  defaultValues: T;
  schema: z.ZodType<T>;
  onSubmit: SubmitHandler<T>;
  children: (methods: {
    control: any;
    register: any;
    formState: any;
    handleSubmit: any;
  }) => React.ReactNode;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  isSubmitting?: boolean;
}

const Form = <T extends FieldValues>({
  defaultValues,
  schema,
  onSubmit,
  children,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = true,
  isSubmitting = false
}: FormProps<T>) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<T>({
    defaultValues,
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {children({
        control,
        register,
        formState: { errors, isDirty },
        handleSubmit
      })}

      <div className="flex justify-end space-x-3 mt-6">
        {showReset && (
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {resetLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default Form;
