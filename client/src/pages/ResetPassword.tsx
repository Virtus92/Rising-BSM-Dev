import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../api/services/authService';
import React from 'react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [validating, setValidating] = useState(true);
  
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setMessage({ type: 'error', text: 'Ungültiger Token.' });
        setTokenValid(false);
        setValidating(false);
        return;
      }

      try {
        const response = await authService.validateResetToken(token);
        setTokenValid(true);
      } catch (error: any) {
        setMessage({
          type: 'error',
          text: 'Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.'
        });
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Die Passwörter stimmen nicht überein.' });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!token) throw new Error('Token fehlt');
      
      await authService.resetPassword(token, password, confirmPassword);
      
      setMessage({
        type: 'success',
        text: 'Ihr Passwort wurde erfolgreich zurückgesetzt.'
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600">Validiere Token...</span>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div>
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {message?.text || 'Ungültiger Token. Bitte fordern Sie einen neuen Link an.'}
        </div>
        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-primary-600 hover:text-primary-500">
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
        Neues Passwort festlegen
      </h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        } text-sm`}>
          {message.text}
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Neues Passwort
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Mindestens 8 Zeichen
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Passwort bestätigen
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isSubmitting ? 'Wird gespeichert...' : 'Passwort speichern'}
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

export default ResetPassword;