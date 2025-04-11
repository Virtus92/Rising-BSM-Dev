'use client';

import { useState, useEffect } from 'react';
import { UserService } from '@/infrastructure/clients/UserService';
import { UserDto } from '@/domain/dtos/UserDtos';

export const useUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await UserService.getUsers();
      if (response.success) {
        // Handle various response formats
        if (Array.isArray(response.data)) {
          // Direct array response
          setUsers(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // Object with data property that could be an array
          if (Array.isArray(response.data.data)) {
            setUsers(response.data.data);
          } else {
            // Try to find any array property in the response
            const arrayData = Object.values(response.data).find(value => Array.isArray(value));
            if (arrayData) {
              setUsers(arrayData);
            } else {
              // If we can't find an array, create a single-item array from the data object
              setUsers([response.data as UserDto]);
            }
          }
        } else {
          // No valid data
          setError('Received invalid data format from server');
          setUsers([]);
        }
      } else {
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (userId: number) => {
    try {
      setError(null);
      const response = await UserService.deleteUser(userId);
      
      if (response.success) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        return true;
      } else {
        setError(response.message || 'Failed to delete user');
        return false;
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
      return false;
    }
  };

  return { 
    users, 
    isLoading, 
    error, 
    deleteUser,
    refetch: fetchUsers 
  };
};
