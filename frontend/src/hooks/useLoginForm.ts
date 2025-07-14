import { useState } from 'react';

import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types/auth';

import { useEventTracking } from './useEventTracking';

// Use the existing LoginRequest type
type LoginFormData = LoginRequest;

export const useLoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { trackAuthentication, trackError } = useEventTracking();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    // Track login attempt
    trackAuthentication('login_attempt', undefined, 'form');
    
    try {
      await login(data.Username, data.Password);
      
      // Track successful login
      trackAuthentication('login', true, 'form');
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      
      // Track failed login
      trackAuthentication('login', false, 'form');
      trackError(
        error instanceof Error ? error.message : 'Login failed',
        'AUTH_ERROR',
        'Login.tsx'
      );
      
      setError('root', {
        message: error instanceof Error ? error.message : 'Login failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    handleSubmit,
    errors,
    isLoading,
    showPassword,
    setShowPassword,
    onSubmit
  };
};