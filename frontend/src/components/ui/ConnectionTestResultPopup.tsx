import React, { useEffect, useRef } from 'react';

import { CheckCircle, AlertCircle, Copy, X } from 'lucide-react';

interface ConnectionTestResult {
  IsSuccessful: boolean;
  Message: string;
  Duration?: number;
  AdditionalInfo?: {
    DatabaseVersion?: string;
    DriverVersion?: string;
    SslEnabled?: boolean;
    ServerInfo?: string;
  };
  ErrorCode?: string;
  ErrorDetails?: string;
}

interface ConnectionTestResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  testResult: ConnectionTestResult;
  databaseType: string;
  position?: { top: number; left: number };
}

const ConnectionTestResultPopup: React.FC<ConnectionTestResultPopupProps> = ({
  isOpen,
  onClose,
  testResult,
  databaseType,
  position = { top: 0, left: 0 }
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    const details = [
      `Status: ${testResult.IsSuccessful ? 'Succeeded' : 'Failed'}`,
      `Database: ${databaseType}${testResult.AdditionalInfo?.DatabaseVersion ? ` (ver: ${testResult.AdditionalInfo.DatabaseVersion})` : ''}`,
      `Driver: ${testResult.AdditionalInfo?.DriverVersion || 'Unknown'}`,
      `Ping: ${testResult.Duration || 'unknown'} ms`,
      `SSL: ${testResult.AdditionalInfo?.SslEnabled ? 'yes' : 'no'}`,
      testResult.Message ? `Message: ${testResult.Message}` : '',
      testResult.ErrorCode ? `Error Code: ${testResult.ErrorCode}` : '',
      testResult.ErrorDetails ? `Error Details: ${testResult.ErrorDetails}` : ''
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(details);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={popupRef}
      className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 min-w-80 max-w-md"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {testResult.IsSuccessful ? (
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
            )}
            <span className={`font-medium ${testResult.IsSuccessful ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.IsSuccessful ? 'Succeeded' : 'Failed'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300"
              title="Copy details"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div>
            <span className="text-gray-400">Database: </span>
            <span className="text-white">
              {databaseType}
              {testResult.AdditionalInfo?.DatabaseVersion && (
                <span className="text-gray-300"> (ver: {testResult.AdditionalInfo.DatabaseVersion})</span>
              )}
            </span>
          </div>

          {testResult.AdditionalInfo?.DriverVersion && (
            <div>
              <span className="text-gray-400">Driver: </span>
              <span className="text-white">{testResult.AdditionalInfo.DriverVersion}</span>
            </div>
          )}

          <div>
            <span className="text-gray-400">Ping: </span>
            <span className="text-white">{testResult.Duration || 'unknown'} ms</span>
          </div>

          <div>
            <span className="text-gray-400">SSL: </span>
            <span className="text-white">{testResult.AdditionalInfo?.SslEnabled ? 'yes' : 'no'}</span>
          </div>

          {testResult.AdditionalInfo?.ServerInfo && (
            <div>
              <span className="text-gray-400">Server: </span>
              <span className="text-white">{testResult.AdditionalInfo.ServerInfo}</span>
            </div>
          )}
        </div>

        {testResult.Message && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-sm">
              <span className="text-gray-400">Message: </span>
              <span className={testResult.IsSuccessful ? 'text-green-300' : 'text-red-300'}>
                {testResult.Message}
              </span>
            </div>
          </div>
        )}

        {!testResult.IsSuccessful && testResult.ErrorCode && (
          <div className="mt-2">
            <div className="text-sm">
              <span className="text-gray-400">Error Code: </span>
              <span className="text-red-300">{testResult.ErrorCode}</span>
            </div>
          </div>
        )}

        {!testResult.IsSuccessful && testResult.ErrorDetails && (
          <div className="mt-2">
            <div className="text-sm">
              <span className="text-gray-400">Details: </span>
              <span className="text-red-300">{testResult.ErrorDetails}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 px-4 py-2 rounded-b-lg border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Test Connection
          </span>
          <div className="flex items-center">
            {testResult.IsSuccessful ? (
              <CheckCircle className="w-3 h-3 text-green-400 mr-1" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-400 mr-1" />
            )}
            <span className="text-xs text-gray-300">
              {databaseType} {testResult.AdditionalInfo?.DatabaseVersion || ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTestResultPopup;