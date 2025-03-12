import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../api/services/authService';
import React from 'react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await authService.forgotPassword(email);
      setMessage({
        type: 'success',
        text: 'Wenn ein Konto mit dieser E-Mail existiert, haben wir Anweisungen zum Zurücksetzen des Passworts gesendet.'
      });
      setEmail('');
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
        Passwort vergessen
      </h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        } text-sm`}>
          {message.text}
        </div>
      )}
      
      <p className="mb-4 text-sm text-gray-600">
        Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
      </p>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-Mail-Adresse
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gesendet...' : 'Link zum Zurücksetzen senden'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500">
          Zurück zum Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;