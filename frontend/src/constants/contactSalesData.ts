import { Shield, Zap, Users, Database } from 'lucide-react';

export const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1,000 employees' },
  { value: '1000+', label: '1,000+ employees' }
];

export const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Financial Services' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' }
];

export const useCases = [
  { value: 'database-management', label: 'Database Connection Management' },
  { value: 'application-monitoring', label: 'Application Monitoring' },
  { value: 'security-compliance', label: 'Security & Compliance' },
  { value: 'performance-optimization', label: 'Performance Optimization' },
  { value: 'cloud-migration', label: 'Cloud Migration' },
  { value: 'enterprise-integration', label: 'Enterprise Integration' },
  { value: 'other', label: 'Other' }
];

export const benefits = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade security with advanced encryption and compliance features'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Real-time monitoring and sub-second response times'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Built for teams with role-based access and shared workspaces'
  },
  {
    icon: Database,
    title: 'Universal Compatibility',
    description: 'Works with any database, cloud platform, or API'
  }
];