import React from 'react';

import { UseFormReturn } from 'react-hook-form';

import { Mail, Send, Loader2 } from 'lucide-react';

import { companySizes, industries, useCases } from '../../constants/contactSalesData';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone?: string;
  jobTitle?: string;
  companySize: string;
  industry: string;
  useCase: string;
  message: string;
}

interface ContactFormProps {
  form: UseFormReturn<ContactFormData>;
  onSubmit: (data: ContactFormData) => void;
  isSubmitting: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ form, onSubmit, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl"></div>
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Get Started Today</h2>
          <p className="text-gray-300">Tell us about your needs and we'll create a custom solution for you.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                First Name *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                placeholder="John"
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && (
                <p className="text-sm text-red-400 mt-1">{errors.firstName.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Last Name *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                placeholder="Doe"
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && (
                <p className="text-sm text-red-400 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Business Email *
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              placeholder="john.doe@company.com"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Company and Job Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Company *
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                placeholder="Acme Corp"
                {...register('company', { required: 'Company is required' })}
              />
              {errors.company && (
                <p className="text-sm text-red-400 mt-1">{errors.company.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Job Title
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                placeholder="CTO"
                {...register('jobTitle')}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              placeholder="+1 (555) 123-4567"
              {...register('phone')}
            />
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Company Size *
            </label>
            <select
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              {...register('companySize', { required: 'Company size is required' })}
            >
              <option value="" className="bg-slate-800">Select company size</option>
              {companySizes.map(size => (
                <option key={size.value} value={size.value} className="bg-slate-800">
                  {size.label}
                </option>
              ))}
            </select>
            {errors.companySize && (
              <p className="text-sm text-red-400 mt-1">{errors.companySize.message}</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Industry *
            </label>
            <select
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              {...register('industry', { required: 'Industry is required' })}
            >
              <option value="" className="bg-slate-800">Select industry</option>
              {industries.map(industry => (
                <option key={industry.value} value={industry.value} className="bg-slate-800">
                  {industry.label}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-sm text-red-400 mt-1">{errors.industry.message}</p>
            )}
          </div>

          {/* Use Case */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Primary Use Case *
            </label>
            <select
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              {...register('useCase', { required: 'Use case is required' })}
            >
              <option value="" className="bg-slate-800">Select use case</option>
              {useCases.map(useCase => (
                <option key={useCase.value} value={useCase.value} className="bg-slate-800">
                  {useCase.label}
                </option>
              ))}
            </select>
            {errors.useCase && (
              <p className="text-sm text-red-400 mt-1">{errors.useCase.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Tell us about your project *
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm resize-none"
              placeholder="Describe your database management challenges and what you're looking to achieve with CAMS..."
              {...register('message', { 
                required: 'Message is required',
                minLength: {
                  value: 20,
                  message: 'Please provide more details (minimum 20 characters)'
                }
              })}
            />
            {errors.message && (
              <p className="text-sm text-red-400 mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Get Your Custom Quote</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>sales@cams.ai</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;