import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useLoginForm } from '../../hooks/useLoginForm';
import SEOHead from '../../components/SEO/SEOHead';
import LoginBackground from '../../components/auth/LoginBackground';
import LoginBranding from '../../components/auth/LoginBranding';
import LoginForm from '../../components/auth/LoginForm';

const Login: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const {
    register,
    handleSubmit,
    errors,
    isLoading,
    showPassword,
    setShowPassword,
    onSubmit
  } = useLoginForm();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEOHead
        title="Login - CAMS Database Management Platform"
        description="Sign in to CAMS to manage your database connections, monitor performance, and access your centralized application management dashboard."
        keywords="CAMS login, database management login, sign in, user authentication"
        canonical="/login"
        noIndex={true}
      />
      
      <LoginBackground mousePosition={mousePosition} />

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-12 xl:px-20">
          <LoginBranding />
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-20">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
                  <Database className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-white">CAMS</h1>
              </div>
            </div>

            {/* Login card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
              
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-gray-300">Sign in to your CAMS account</p>
                </div>

                <LoginForm
                  register={register}
                  errors={errors}
                  isLoading={isLoading}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  onSubmit={handleSubmit(onSubmit)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;