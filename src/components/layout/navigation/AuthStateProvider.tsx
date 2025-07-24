import UserMenu from './UserMenu';

export default function AuthStateProvider() {
  // This is a server component that can check cookies
  // The actual authentication logic will still happen on the client
  // but this prevents the initial flash
  return <UserMenu />;
} 