import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface LoginFormData {
  Username: string;
  Password: string;
}

interface LoginFormProps {
  register: UseFormRegister<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  isLoading: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  register,
  errors,
  isLoading,
  showPassword,
  onTogglePassword,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Username field */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-gray-200">
          Username
        </label>
        <div className="relative">
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={`w-full px-4 py-3 bg-white/10 border ${errors.Username ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
            placeholder="Enter your username"
            {...register('Username', { 
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              }
            })}
          />
        </div>
        {errors.Username && (
          <p className="text-sm text-red-400">{errors.Username.message}</p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-200">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`w-full px-4 py-3 pr-12 bg-white/10 border ${errors.Password ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
            placeholder="Enter your password"
            {...register('Password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            onClick={onTogglePassword}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.Password && (
          <p className="text-sm text-red-400">{errors.Password.message}</p>
        )}
      </div>

      {/* Error message */}
      {errors.root && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
          <p className="text-sm text-red-300">{errors.root.message}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <div className="relative flex items-center justify-center">
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </div>
      </button>

      {/* Contact Sales link */}
      <div className="text-center">
        <p className="text-gray-300">
          Need access to CAMS?{' '}
          <Link 
            to="/contact-sales" 
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Contact Sales
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;