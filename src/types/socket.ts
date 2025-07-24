export type SocketType = {
    emit: (event: string, data?: unknown, callback?: (response?: unknown) => void) => void;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    disconnect: () => void;
  };