'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import firebase_app from './firebase-config';

export interface AuthContextType {
  user: User | null;
}

// Initialize Firebase auth instance
export const auth = getAuth( firebase_app );

// Create the authentication context
export const AuthContext = createContext( {});

// Custom hook to access the authentication context
export const useAuthContext = () => useContext( AuthContext );

interface AuthContextProviderProps {
  children: ReactNode;
}

export function AuthContextProvider( { children }: AuthContextProviderProps ): JSX.Element {
  // Set up state to track the authenticated user and loading status
  const [ user, setUser ] = useState<User | null>( null );
  const [ loading, setLoading ] = useState( true );

  useEffect( () => {
    // Subscribe to the authentication state changes
    const unsubscribe = onAuthStateChanged( auth, ( user ) => {
      if ( user ) {
        // User is signed in
        setUser( user );
      } else {
        // User is signed out
        setUser( null );
      }
      // Set loading to false once authentication state is determined
      setLoading( false );
    } );

    // Unsubscribe from the authentication state changes when the component is unmounted
    return () => unsubscribe();
  }, [] );

  // Provide the authentication context to child components
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
