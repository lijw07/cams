# Data Model and Property Name Mismatch Report

## Overview
This report identifies mismatches between frontend TypeScript interfaces and backend C# models in the CAMS project. According to CLAUDE.md, all properties should use PascalCase for consistency between frontend and backend.

## Critical Issues Found

### 1. Application Model - Major camelCase Violations

**Frontend (`frontend/src/types/application.ts`)**
```typescript
export interface Application {
  id: number;                    // ❌ Should be: Id
  name: string;                  // ❌ Should be: Name
  description?: string;          // ❌ Should be: Description
  version?: string;              // ❌ Should be: Version
  environment?: string;          // ❌ Should be: Environment
  tags?: string;                 // ❌ Should be: Tags
  isActive: boolean;             // ❌ Should be: IsActive
  createdAt: string;             // ❌ Should be: CreatedAt
  updatedAt: string;             // ❌ Should be: UpdatedAt
  lastAccessedAt?: string;       // ❌ Should be: LastAccessedAt
  databaseConnectionCount: number;// ❌ Should be: DatabaseConnectionCount
  databaseConnections?: DatabaseConnectionSummary[];  // ❌ Should be: DatabaseConnections
}
```

**Backend (`Backend/Model/Application.cs` and `Backend/View/ApplicationResponse.cs`)**
- All properties correctly use PascalCase: `Id`, `Name`, `Description`, `Version`, `Environment`, `Tags`, `IsActive`, `CreatedAt`, `UpdatedAt`, `LastAccessedAt`, `DatabaseConnectionCount`, `DatabaseConnections`

### 2. DatabaseConnection Model - Major camelCase Violations

**Frontend (`frontend/src/types/database.ts`)**
```typescript
export interface DatabaseConnection {
  id: number;                    // ❌ Should be: Id
  applicationId: number;         // ❌ Should be: ApplicationId
  applicationName: string;       // ❌ Should be: ApplicationName
  name: string;                  // ❌ Should be: Name
  description?: string;          // ❌ Should be: Description
  type: DatabaseType;            // ❌ Should be: Type
  typeName: string;              // ❌ Should be: TypeName
  server: string;                // ❌ Should be: Server
  port?: number;                 // ❌ Should be: Port
  database?: string;             // ❌ Should be: Database
  username?: string;             // ❌ Should be: Username
  apiBaseUrl?: string;           // ❌ Should be: ApiBaseUrl
  additionalSettings?: string;   // ❌ Should be: AdditionalSettings
  isActive: boolean;             // ❌ Should be: IsActive
  createdAt: string;             // ❌ Should be: CreatedAt
  updatedAt: string;             // ❌ Should be: UpdatedAt
  lastTestedAt?: string;         // ❌ Should be: LastTestedAt
  status: ConnectionStatus;      // ❌ Should be: Status
  statusName: string;            // ❌ Should be: StatusName
  lastTestResult?: string;       // ❌ Should be: LastTestResult
  connectionString?: string;     // ❌ Should be: ConnectionString
  hasApiKey: boolean;            // ❌ Should be: HasApiKey
}

export interface DatabaseConnectionSummary {
  id: number;                    // ❌ Should be: Id
  name: string;                  // ❌ Should be: Name
  typeName: string;              // ❌ Should be: TypeName
  isActive: boolean;             // ❌ Should be: IsActive
  statusName: string;            // ❌ Should be: StatusName
  lastTestedAt?: string;         // ❌ Should be: LastTestedAt
}
```

**Backend (`Backend/Model/DatabaseConnection.cs` and `Backend/View/DatabaseConnectionResponse.cs`)**
- All properties correctly use PascalCase

### 3. Role Model - Major camelCase Violations

**Frontend (`frontend/src/types/management.ts`)**
```typescript
export interface Role {
  id: number;                    // ❌ Should be: Id
  name: string;                  // ❌ Should be: Name
  description?: string;          // ❌ Should be: Description
  isActive: boolean;             // ❌ Should be: IsActive
  createdAt: string;             // ❌ Should be: CreatedAt
  updatedAt: string;             // ❌ Should be: UpdatedAt
  userCount: number;             // ❌ Should be: UserCount
  permissions: string[];         // ❌ Should be: Permissions
}

export interface RoleRequest {
  name: string;                  // ❌ Should be: Name
  description?: string;          // ❌ Should be: Description
  isActive: boolean;             // ❌ Should be: IsActive
  permissions: string[];         // ❌ Should be: Permissions
}
```

**Backend (`Backend/Model/Role.cs` and `Backend/View/RoleResponse.cs`)**
- Backend correctly uses PascalCase
- Backend has `IsSystem` property missing in frontend
- Frontend has `permissions` property not present in backend models

### 4. User Management DTOs - Major camelCase Violations

**Frontend (`frontend/src/types/management.ts`)**
```typescript
export interface UserCreateRequest {
  username: string;              // ❌ Should be: Username
  email: string;                 // ❌ Should be: Email
  firstName: string;             // ❌ Should be: FirstName
  lastName: string;              // ❌ Should be: LastName
  phoneNumber?: string;          // ❌ Should be: PhoneNumber
  password: string;              // ❌ Should be: Password
  roleIds: number[];             // ❌ Should be: RoleIds
  isActive: boolean;             // ❌ Should be: IsActive
  sendWelcomeEmail: boolean;     // ❌ Should be: SendWelcomeEmail
}
```

**Backend (`Backend/View/CreateUserRequest.cs`)**
- Backend correctly uses PascalCase
- Frontend has `sendWelcomeEmail` property not present in backend

### 5. Migration DTOs - Major camelCase Violations

**Frontend (`frontend/src/types/migration.ts`)**
```typescript
export interface MigrationRequest {
  migrationType: 'Users' | 'Roles' | 'Applications';  // ❌ Should be: MigrationType
  data: string;                  // ❌ Should be: Data
  dataFormat: 'JSON' | 'CSV';    // ❌ Should be: DataFormat
  validateOnly: boolean;         // ❌ Should be: ValidateOnly
  overwriteExisting: boolean;    // ❌ Should be: OverwriteExisting
  sendNotifications: boolean;    // ❌ Should be: SendNotifications
}

export interface UserImportDto {
  username: string;              // ❌ Should be: Username
  email: string;                 // ❌ Should be: Email
  password?: string;             // ❌ Should be: Password
  firstName?: string;            // ❌ Should be: FirstName
  lastName?: string;             // ❌ Should be: LastName
  phoneNumber?: string;          // ❌ Should be: PhoneNumber
  isActive: boolean;             // ❌ Should be: IsActive
  roles: string[];               // ❌ Should be: Roles
}
```

### 6. Log Types - Major camelCase Violations

**Frontend (`frontend/src/types/logs.ts`)**
All log interfaces (AuditLog, SystemLog, SecurityLog, PerformanceLog) use camelCase for all properties, which violates the PascalCase convention.

### 7. ConnectionTestSchedule - Major camelCase Violations

**Frontend (`frontend/src/types/application.ts`)**
```typescript
export interface ConnectionTestSchedule {
  id?: number;                   // ❌ Should be: Id
  applicationId: number;         // ❌ Should be: ApplicationId
  applicationName?: string;      // ❌ Should be: ApplicationName
  cronExpression: string;        // ❌ Should be: CronExpression
  isEnabled: boolean;            // ❌ Should be: IsEnabled
  lastRunTime?: string;          // ❌ Should be: LastRunTime
  nextRunTime?: string;          // ❌ Should be: NextRunTime
  lastRunStatus?: 'success' | 'failed' | 'running';  // ❌ Should be: LastRunStatus
  createdAt?: string;            // ❌ Should be: CreatedAt
  updatedAt?: string;            // ❌ Should be: UpdatedAt
}
```

## Correctly Implemented Interfaces

The following interfaces correctly use PascalCase:
- `LoginRequest` and `LoginResponse` (auth.ts)
- `ApplicationRequest` (application.ts)
- `ApplicationWithConnectionRequest` (application.ts)
- `DatabaseConnectionRequest` (database.ts)
- `User` interface in auth.ts (correctly uses PascalCase)
- `RegisterRequest`, `ChangePasswordRequest`, `ChangeEmailRequest` (auth.ts)

## Summary of Issues

1. **Critical Violations**: Most display models (Application, DatabaseConnection, Role, etc.) use camelCase in the frontend, which will cause API communication failures.

2. **Inconsistency**: Some interfaces follow PascalCase (request/response DTOs) while others don't (display models).

3. **Missing Properties**: Some properties exist in frontend but not backend (e.g., `permissions` in Role, `sendWelcomeEmail` in UserCreateRequest).

4. **Type Mismatches**: Some properties have different types or formats between frontend and backend.

## Recommended Actions

1. **Immediate Fix Required**: Convert all frontend TypeScript interfaces to use PascalCase for all properties.

2. **Update Form Registrations**: Ensure all react-hook-form registrations use PascalCase field names.

3. **Update API Service Calls**: Verify all API service methods handle PascalCase properties correctly.

4. **Add Missing Properties**: Sync missing properties between frontend and backend models.

5. **Create Mapping Functions**: If needed for backwards compatibility, create explicit mapping functions to convert between camelCase and PascalCase.

## Impact Assessment

**High Risk Areas**:
- Application CRUD operations
- Database connection management
- Role management
- User management
- Log viewing functionality
- Migration operations

These mismatches will cause:
- 400 Bad Request errors on form submissions
- Properties showing as undefined in API responses
- Validation errors for "required" fields that appear filled
- General API communication failures

## Priority

**CRITICAL** - These mismatches will cause runtime errors and prevent the application from functioning correctly. All interfaces that interact with the backend API must be updated to use PascalCase immediately.