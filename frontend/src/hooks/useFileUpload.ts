import { useState, useCallback } from 'react';

/**
 * Hook for handling file upload and content reading
 * Manages file reading state and content extraction
 */
export const useFileUpload = () => {
  const [importData, setImportData] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  }, []);

  const clearData = useCallback(() => {
    setImportData('');
  }, []);

  const updateData = useCallback((data: string) => {
    setImportData(data);
  }, []);

  return {
    importData,
    isLoading,
    handleFileUpload,
    clearData,
    updateData
  };
};