import 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      // Add other custom properties here
      name: string | null;
      email: string | null;
      isPremium: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback */
  interface JWT {
    id?: string;
    // Add other custom properties here
  }
}

export {};