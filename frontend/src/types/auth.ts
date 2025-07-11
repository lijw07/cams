// Auth Types
export interface LoginRequest {
  Username: string;
  Password: string;
}

export interface LoginResponse {
  Token: string;
  RefreshToken: string;
  Expiration: string;
  Username: string;
  Email: string;
  UserId: number;
  success?: boolean;
  message?: string;
}

export interface User {
  Id: number;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  CreatedAt: string;
  UpdatedAt: string;
  LastLoginAt?: string;
  IsActive: boolean;
}

export interface UserProfileResponse extends User {
  ApplicationCount: number;
  DatabaseConnectionCount: number;
  Roles: string[];
}

export interface RegisterRequest {
  Username: string;
  Email: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  Password: string;
  ConfirmPassword: string;
}

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}

export interface ChangeEmailRequest {
  NewEmail: string;
  CurrentPassword: string;
}

export interface UpdateProfileRequest {
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
}