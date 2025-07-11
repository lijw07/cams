import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Database, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { useNotifications } from '../../contexts/NotificationContext';
import SEOHead from '../../components/SEO/SEOHead';

interface RegisterFormData {
  Username: string;
  Email: string;
  Password: string;
  ConfirmPassword: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<RegisterFormData>();

  const password = watch('Password');
  const email = watch('Email');

  // Check email availability
  const checkEmailAvailability = React.useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const result = await authService.checkEmailAvailability(email);
      setEmailAvailable(result.isAvailable);
      if (!result.isAvailable) {
        setError('Email', { message: result.message });
      } else {
        clearErrors('Email');
      }
    } catch (error) {
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  }, [setError, clearErrors]);

  // Debounced email check
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email) {
        checkEmailAvailability(email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email, checkEmailAvailability]);

  const onSubmit = async (data: RegisterFormData) => {
    if (data.Password !== data.ConfirmPassword) {
      setError('ConfirmPassword', { message: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      // Here you would call your register API
      // For now, we'll just show success and redirect to login
      addNotification({ 
        title: 'Success', 
        message: 'Account created successfully! Please sign in.', 
        type: 'success', 
        source: 'Register' 
      });
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      setError('root', {
        message: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Register - Join CAMS Database Management Platform"
        description="Create your CAMS account to start managing database connections, monitoring performance, and collaborating with your team. Free registration."
        keywords="CAMS register, sign up, create account, database management registration"
        canonical="/register"
        noIndex={true}
      />
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary">
            <Database className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Join the Centralized Application Management System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className={`input mt-1 ${errors.FirstName ? 'border-red-500' : ''}`}
                  placeholder="First name"
                  {...register('FirstName', { 
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                />
                {errors.FirstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.FirstName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={`input mt-1 ${errors.LastName ? 'border-red-500' : ''}`}
                  placeholder="Last name"
                  {...register('LastName', { 
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                />
                {errors.LastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.LastName.message}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                className={`input mt-1 ${errors.Username ? 'border-red-500' : ''}`}
                placeholder="Username"
                {...register('Username', { 
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers, and underscores'
                  }
                })}
              />
              {errors.Username && (
                <p className="mt-1 text-sm text-red-600">{errors.Username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  type="email"
                  className={`input pr-10 ${errors.Email ? 'border-red-500' : emailAvailable === true ? 'border-green-500' : ''}`}
                  placeholder="Email address"
                  {...register('Email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {checkingEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                {emailAvailable === true && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              {errors.Email && (
                <p className="mt-1 text-sm text-red-600">{errors.Email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-gray-500">(optional)</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className="input mt-1"
                placeholder="Phone number"
                {...register('PhoneNumber')}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.Password ? 'border-red-500' : ''}`}
                  placeholder="Password"
                  {...register('Password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.Password && (
                <p className="mt-1 text-sm text-red-600">{errors.Password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.ConfirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm password"
                  {...register('ConfirmPassword', { 
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.ConfirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.ConfirmPassword.message}</p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || emailAvailable === false}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary-dark"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;