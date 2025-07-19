export interface User {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatar?: string;
  cover?: string;
  skills?: string[];
  birthdate?: string | null;
  gender?: string | null;
  role?: string;
  followers?: any[];
  following?: any[];
  bio?: string;
  socialLinks?: { platform: string; url: string }[];
}

export interface UserResponse {
  user: User;
  token: string;
} 