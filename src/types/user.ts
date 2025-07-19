export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
  username: string;
  followers?: string[]; // array of user IDs
  following?: string[]; // array of user IDs
  // ...add more fields if needed
}; 