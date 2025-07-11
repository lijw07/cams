import React from 'react';

import { Users, Shield, Package } from 'lucide-react';

interface MigrationTypeOption {
  value: 'Users' | 'Roles' | 'Applications';
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface MigrationTypeSelectorProps {
  selectedType: 'Users' | 'Roles' | 'Applications';
  onTypeChange: (type: 'Users' | 'Roles' | 'Applications') => void;
  dataFormat: 'JSON' | 'CSV';
  onFormatChange: (format: 'JSON' | 'CSV') => void;
}

const MigrationTypeSelector: React.FC<MigrationTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  dataFormat,
  onFormatChange
}) => {
  const migrationTypes: MigrationTypeOption[] = [
    { 
      value: 'Users', 
      label: 'Users', 
      icon: Users, 
      description: 'Import user accounts with roles and permissions' 
    },
    { 
      value: 'Roles', 
      label: 'Roles', 
      icon: Shield, 
      description: 'Import roles and permission assignments' 
    },
    { 
      value: 'Applications', 
      label: 'Applications', 
      icon: Package, 
      description: 'Import application configurations' 
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Migration Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {migrationTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedType === type.value;
            
            return (
              <div
                key={type.value}
                className={`
                  relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                  ${isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
                onClick={() => onTypeChange(type.value)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="migrationType"
                    value={type.value}
                    checked={isSelected}
                    onChange={() => onTypeChange(type.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <IconComponent className={`h-6 w-6 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'}`}>
                      {type.label}
                    </div>
                  </div>
                </div>
                <p className={`mt-2 text-sm ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {type.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Data Format
        </h3>
        <div className="flex space-x-4">
          {(['JSON', 'CSV'] as const).map((format) => (
            <label key={format} className="flex items-center">
              <input
                type="radio"
                name="dataFormat"
                value={format}
                checked={dataFormat === format}
                onChange={(e) => onFormatChange(e.target.value as 'JSON' | 'CSV')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {format}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MigrationTypeSelector;