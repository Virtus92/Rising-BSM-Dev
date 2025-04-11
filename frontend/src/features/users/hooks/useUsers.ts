'use client';

import { useState, useEffect } from 'react';
import { UserService } from '@/infrastructure/services/UserService';
import { UserDto } from '@/domain/dtos/UserDtos';

export const useUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await UserService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
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
