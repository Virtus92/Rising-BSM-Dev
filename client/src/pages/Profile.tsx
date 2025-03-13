import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../api/services/profileService';
import React from 'react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefon: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.user.name || '',
        email: profileData.user.email || '',
        telefon: profileData.user.telefon || ''
      });
    }
  }, [profileData]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await profileService.getUserProfile();
      setProfileData(data);
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError('Fehler beim Laden der Profildaten');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await profileService.updateProfile(formData);
      setSuccess('Profil erfolgreich aktualisiert');
      
      if (user) {
        updateUser({
          ...user,
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' '),
          email: formData.email
        });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Fehler beim Aktualisieren des Profils');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setError(null);
    setSuccess(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Die Passwörter stimmen nicht überein');
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError('Das neue Passwort muss mindestens 8 Zeichen lang sein');
      setIsChangingPassword(false);
      return;
    }

    try {
      await profileService.updatePassword(
        passwordData.current_password,
        passwordData.new_password
      );
      setSuccess('Passwort erfolgreich geändert');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mein Profil</h1>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-md text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Persönliche Informationen</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail</label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="telefon" className="block text-sm font-medium text-gray-700">Telefon</label>
              <input
                type="tel"
                name="telefon"
                id="telefon"
                value={formData.telefon}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rolle</label>
              <input
                type="text"
                id="role"
                value={user?.role === 'admin' ? 'Administrator' : user?.role === 'manager' ? 'Manager' : 'Mitarbeiter'}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
              />
            </div>
          </div>
          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isSubmitting ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Passwort ändern</h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">Aktuelles Passwort</label>
              <input
                type="password"
                name="current_password"
                id="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">Neues Passwort</label>
              <input
                type="password"
                name="new_password"
                id="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Mindestens 8 Zeichen</p>
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">Passwort wiederholen</label>
              <input
                type="password"
                name="confirm_password"
                id="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isChangingPassword ? 'Wird geändert...' : 'Passwort ändern'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {profileData?.activity && profileData.activity.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Letzte Aktivitäten</h2>
          </div>
          <div className="px-6 py-5">
            <ul className="divide-y divide-gray-200">
              {profileData.activity.map((activity: any, index: number) => (
                <li key={index} className="py-3">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'login' ? 'Anmeldung' : 
                         activity.type === 'password_changed' ? 'Passwort geändert' : 
                         activity.type === 'profile_updated' ? 'Profil aktualisiert' : 
                         activity.type}
                      </p>
                      <p className="text-xs text-gray-500">IP: {activity.ip}</p>
                    </div>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;