# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a full-stack CAMS (Connection & Application Management System) with:
- **Backend**: .NET 8.0 Web API with MVC architecture
- **Frontend**: React 18 + TypeScript with Vite build tool
- **Database**: SQL Server 2022 (containerized)
- **Infrastructure**: Docker with multi-service architecture

## Essential Commands

### Backend (.NET API)
```bash
# Build and run
dotnet build
dotnet run
dotnet watch run      # Development with hot reload

# Build for production
dotnet build -c Release

# Clean and restore
dotnet clean
dotnet restore
```

### Frontend (React)
```bash
# Navigate to frontend directory
cd frontend

# Install and run
npm install
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Run linting
npm run type-check   # Type checking
```

### Docker (Full Stack)
```bash
# Development mode
docker-compose up --build

# Production mode
docker-compose -f docker-compose.prod.yml up --build

# Stop services
docker-compose down
docker-compose down -v    # Remove volumes
```

### Testing
```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test class
dotnet test --filter "LoginControllerTests"
```

## Architecture

### Project Structure
```
Backend/
├── Controller/           # Thin API controllers only
├── Services/            # Business logic and orchestration
├── Model/               # Domain models and entities
├── View/                # DTOs and view models
├── Helpers/             # Utility functions
├── Validators/          # Input validation
├── Mappers/             # Data transformation
├── Constants/           # String literals and magic numbers
├── Enums/               # Type-safe enumerations
├── Extensions/          # Extension methods
├── Exceptions/          # Custom exceptions
├── Configuration/       # Configuration classes
└── Data/               # Entity Framework DbContext
```

### Dependency Flow
```
Controllers → Services → Repositories/Data Access
     ↓
  Helpers/Validators/Mappers (supporting classes)
```

### Key Entities
- **User**: Authentication and user management
- **Application**: Application configuration and metadata
- **DatabaseConnection**: Database connection configurations
- **Role/UserRole**: Role-based access control
- **Audit/Security/Performance/SystemLog**: Comprehensive logging

## Clean Code Practices

### C# Coding Standards
- Use PascalCase for public members, classes, and methods
- Use camelCase for private fields and local variables
- Prefix private fields with underscore: `_privateField`
- Use meaningful, descriptive names that express intent
- Constants should be UPPER_CASE with underscores

### SOLID Principles
- **Single Responsibility**: Each class should have only one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Many specific interfaces are better than one general-purpose interface
- **Dependency Inversion**: Depend on abstractions, not concretions

### DRY (Don't Repeat Yourself)
- **Eliminate code duplication** across the codebase
- **Extract common functionality** into reusable methods, classes, or services
- **Use inheritance and composition** to share behavior between related classes
- **Create utility classes** for frequently used operations
- **Abstract common patterns** into base classes or interfaces
- **Use constants and enums** instead of repeated magic strings/numbers

### Other Key Principles
- **KISS (Keep It Simple, Stupid)**: Write simple, understandable code
- **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until needed
- **Separation of Concerns**: Each class/method should focus on a single concern
- **Fail Fast**: Validate inputs early and throw exceptions quickly
- **Composition over Inheritance**: Prefer composition to build complex behavior

### Critical Rules
1. **One class per file** - File name MUST match class name exactly
2. **Controllers are thin** - No business logic, validation, or helper methods
3. **Single responsibility** - Each method does exactly one thing
4. **Nullable reference types** - Handle null values properly
5. **Async/await properly** - Use async methods with `Async` suffix
6. **Guard clauses** - Validate parameters early and fail fast

### Controller Pattern
```csharp
// ✅ GOOD - Thin controller with service injection
[ApiController]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    
    public UserController(IUserService userService)
    {
        _userService = userService;
    }
    
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var result = await _userService.CreateUserAsync(request);
        return result.IsSuccess ? Ok(result.Data) : BadRequest(result.ErrorMessage);
    }
}
```

### Service Layer Pattern
```csharp
// ✅ GOOD - Business logic in service
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly IUserValidator _userValidator;
    
    public async Task<ServiceResult<UserDto>> CreateUserAsync(CreateUserRequest request)
    {
        // Validation
        var validationResult = await _userValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
            return ServiceResult<UserDto>.Failure(validationResult.ErrorMessage);
        
        // Business logic
        var user = _userMapper.MapToEntity(request);
        user.PasswordHash = PasswordHelper.HashPassword(request.Password);
        
        // Data persistence
        var savedUser = await _userRepository.CreateAsync(user);
        
        // Side effects
        await _emailService.SendWelcomeEmailAsync(user.Email);
        
        return ServiceResult<UserDto>.Success(_userMapper.MapToDto(savedUser));
    }
}
```

### Naming Conventions
- **Controllers**: `[Entity]Controller` (e.g., `UserController`)
- **Services**: `[Entity]Service` and `I[Entity]Service`
- **Helpers**: `[Purpose]Helper` (e.g., `PasswordHelper`)
- **Validators**: `[Entity]Validator`
- **Mappers**: `[Entity]Mapper`
- **Constants**: `[Module]Constants`
- **Enums**: Descriptive names (e.g., `DatabaseType`, `UserRole`)
- **DTOs**: `[Entity][Purpose]Request/Response`

### Constants vs Enums
```csharp
// Constants - String literals, configuration keys
public static class ApplicationConstants
{
    public static class ErrorMessages
    {
        public const string INVALID_CREDENTIALS = "Invalid username or password";
        public const string USER_NOT_FOUND = "User not found";
    }
}

// Enums - Type-safe categorizations
public enum DatabaseType
{
    SqlServer,
    MySQL,
    PostgreSQL,
    Oracle,
    SQLite,
    RestApi
}
```

## Required Logging
**EVERY user interaction MUST be logged with appropriate context:**

```csharp
// ✅ GOOD - Structured logging with context
_logger.LogInformation("User {UserId} created application {ApplicationId} ({ApplicationName})", 
    userId, application.Id, application.Name);

// ✅ GOOD - Error with context and exception
_logger.LogError(ex, "Error creating database connection {ConnectionName} for user {UserId}", 
    request.Name, userId);

// ❌ BAD - No context or user identification
_logger.LogInformation("Application created");
```

**Mandatory Log Fields:**
- **User ID**: Always include in user-initiated operations
- **Resource ID**: Include relevant IDs (ApplicationId, ConnectionId, etc.)
- **Action**: Clear description of what was attempted/completed
- **Result**: Success/failure indication
- **Error Details**: Full exception context for errors

## Build Verification Requirements
**ALWAYS complete these steps before marking any task as complete:**

1. **Build the project**: `dotnet build` - Fix ALL errors and warnings
2. **Run all tests**: `dotnet test` - ALL tests must pass
3. **Check for issues**: No unused usings, TODO comments, or debug statements
4. **Verify implementation**: Feature works, edge cases handled, logging in place

## Security Best Practices
- Never log sensitive information (passwords, tokens, API keys)
- Use parameterized queries to prevent SQL injection
- Validate all inputs at boundaries
- Implement proper authentication and authorization
- Store secrets in secure configuration (not in code)

## Common Anti-Patterns to Avoid
1. **Fat Controllers**: Controllers with business logic or validation
2. **God Classes**: Classes that do too many things
3. **Magic Numbers/Strings**: Hard-coded values without constants
4. **Multiple classes per file**: Each class gets its own file
5. **Mixed Constants and Enums**: Keep them separate
6. **Tight Coupling**: Use dependency injection
7. **Method doing multiple things**: Split into focused methods

## Project Preferences
- **Prefer composition over inheritance**
- **Prefer explicit over implicit**
- **Prefer async/await over Task.Result**
- **Prefer early returns over nested if statements**
- **Prefer specific exceptions over generic ones**
- **Prefer small, focused methods**
- **Prefer enums over string constants**

# Frontend Clean Code Standards

## React Component Architecture

### Component Size Limits
**CRITICAL RULE: No component should exceed 150 lines including imports and exports**

```tsx
// ❌ BAD - 400+ line monster component
const ApplicationWithConnectionModal = () => {
  // Massive component with multiple responsibilities
};

// ✅ GOOD - Break into focused components
const ApplicationWithConnectionModal = () => (
  <Modal>
    <ApplicationConnectionWizard />
  </Modal>
);

const ApplicationConnectionWizard = () => {
  const { currentStep } = useWizardSteps();
  return (
    <>
      <WizardHeader currentStep={currentStep} />
      <WizardContent currentStep={currentStep} />
      <WizardFooter currentStep={currentStep} />
    </>
  );
};
```

### Single Responsibility Principle
**Each component must have exactly ONE responsibility:**

```tsx
// ❌ BAD - Multiple responsibilities
const UserModal = () => {
  // 1. Modal management
  // 2. Form validation
  // 3. API calls
  // 4. Business logic
  // 5. Complex UI rendering
};

// ✅ GOOD - Single responsibility per component
const UserModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <UserForm onSubmit={handleSubmit} />
  </Modal>
);

const UserForm = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm();
  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
};
```

### Component Composition Rules

**1. Presentational vs Container Components**
```tsx
// ✅ Presentational Component - Pure UI
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => (
  <button className={`btn btn-${variant}`} onClick={onClick}>
    {children}
  </button>
);

// ✅ Container Component - Business Logic
const UserManagement: React.FC = () => {
  const { users, loading } = useUsers();
  const { addNotification } = useNotifications();
  
  const handleDeleteUser = async (id: string) => {
    // Business logic here
  };

  return <UserList users={users} loading={loading} onDelete={handleDeleteUser} />;
};
```

**2. Extract Custom Hooks for Business Logic**
```tsx
// ❌ BAD - Business logic in component
const UserComponent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await userService.getUsers();
        setUsers(data);
      } catch (error) {
        // error handling
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // More logic...
};

// ✅ GOOD - Extract to custom hook
const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, fetchUsers };
};

const UserComponent = () => {
  const { users, loading, error } = useUsers();
  return <UserList users={users} loading={loading} />;
};
```

### File Organization Standards

**Mandatory Directory Structure:**
```
frontend/src/
├── components/
│   ├── common/           # Reusable UI components (Button, Input, Modal)
│   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   ├── forms/           # Form-specific components
│   └── modals/          # Modal components (max 150 lines each)
├── pages/               # Page-level components (max 200 lines each)
├── hooks/               # Custom React hooks (max 100 lines each)
├── contexts/            # React Context providers
├── services/            # API calls and external services
├── utils/               # Pure utility functions
├── types/               # TypeScript definitions
└── constants/           # Application constants
```

### Form Management Requirements

**ALWAYS use react-hook-form for forms with more than 2 fields:**

```tsx
// ❌ BAD - Manual state management
const UserForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Manual validation logic...
  };
};

// ✅ GOOD - react-hook-form
const UserForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  const onSubmit = (data: UserFormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
};
```

### State Management Rules

**1. Use appropriate state management for scope:**
```tsx
// ✅ Local state for component-specific data
const [isOpen, setIsOpen] = useState(false);

// ✅ Context for global app state
const { user, notifications, theme } = useContext(AppContext);

// ✅ Custom hooks for shared business logic
const { users, createUser, deleteUser } = useUsers();
```

**2. Avoid prop drilling beyond 2 levels:**
```tsx
// ❌ BAD - Prop drilling
<GrandParent user={user}>
  <Parent user={user}>
    <Child user={user} />
  </Parent>
</GrandParent>

// ✅ GOOD - Context or custom hook
const Child = () => {
  const { user } = useAuth();
  return <div>{user.name}</div>;
};
```

### TypeScript Standards

**1. Strict Type Safety**
```tsx
// ❌ BAD - Using 'any'
const handleSubmit = (data: any) => {
  // No type safety
};

// ✅ GOOD - Proper interfaces
interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
}

const handleSubmit = (data: UserFormData) => {
  // Type-safe
};
```

**2. Generic Components**
```tsx
// ✅ GOOD - Reusable with generics
interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
}

const Table = <T,>({ data, columns, onRowClick }: TableProps<T>) => {
  // Implementation
};
```

### Performance Requirements

**1. Optimize Re-renders**
```tsx
// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// ✅ Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ Use useCallback for event handlers passed to children
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

**2. Lazy Loading**
```tsx
// ✅ Lazy load heavy components
const HeavyModal = lazy(() => import('./HeavyModal'));

// ✅ Code splitting by route
const UserManagement = lazy(() => import('../pages/UserManagement'));
```

## Frontend Anti-Patterns to Avoid

**1. God Components (>150 lines)**
**2. Business Logic in JSX**
**3. Deep Prop Drilling (>2 levels)**
**4. Manual Form State Management**
**5. Inline Styles Instead of CSS Classes**
**6. Direct DOM Manipulation**
**7. Missing Error Boundaries**
**8. Unused Dependencies**

## Frontend Code Review Checklist

**Before submitting any frontend code:**

1. **Component Size**: No component >150 lines
2. **Single Responsibility**: Each component has one job
3. **Custom Hooks**: Business logic extracted to hooks
4. **TypeScript**: No 'any' types, proper interfaces
5. **Performance**: Memoization where needed
6. **Testing**: Unit tests for business logic
7. **Accessibility**: Proper ARIA labels and keyboard navigation
8. **Error Handling**: Error boundaries and user feedback

## Mandatory Refactoring Triggers

**IMMEDIATELY refactor if you encounter:**

- Any component >150 lines
- useState with >5 state variables
- useEffect with >3 dependencies
- Props drilling >2 levels deep
- Duplicate code patterns
- Missing TypeScript types
- Business logic in JSX
- API calls directly in components