export const getPerformanceLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'normal': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    case 'slow': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
};

export const getStatusCodeColor = (statusCode: number) => {
  if (statusCode >= 200 && statusCode < 300) return 'text-green-600 dark:text-green-400';
  if (statusCode >= 300 && statusCode < 400) return 'text-blue-600 dark:text-blue-400';
  if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600 dark:text-yellow-400';
  if (statusCode >= 500) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
};

export const formatDuration = (duration: string) => {
  try {
    const ms = parseFloat(duration.replace(/[^\d.]/g, ''));
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  } catch {
    return duration;
  }
};

export const formatBytes = (bytes: number | undefined) => {
  if (!bytes) return 'N/A';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};