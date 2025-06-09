// src/components/AuthComponent.jsx

import React from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../firebase"; // Import from our setup file

const AuthComponent = () => {
  const [user, loading, error] = useAuthState(auth);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    signOut(auth);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="absolute top-4 right-4">
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">
            {user.displayName}
          </span>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Login with Google
        </button>
      )}
    </div>
  );
};

export default AuthComponent;
