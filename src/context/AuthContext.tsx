import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types/mobile';

interface StoredAccount extends AuthUser {
  passwordHash: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  requireAuth: boolean;
  accounts: AuthUser[];
  login: (identifier: string, password: string) => { success: boolean; message: string };
  registerUser: (username: string, password: string, name: string, role: 'Owner' | 'Manager' | 'Staff', email?: string) => { success: boolean; message: string };
  updatePassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
  updateUsername: (newUsername: string) => { success: boolean; message: string };
  toggleRequireAuth: (require: boolean) => void;
  logout: () => void;
}

const ACCOUNTS_STORAGE_KEY = 'zafar_mobile_accounts_v2';
const SESSION_STORAGE_KEY = 'zafar_mobile_auth_session_v2';
const REQUIRE_AUTH_KEY = 'zafar_mobile_require_auth_v2';

// Default primary administrator account
const DEFAULT_PRIMARY_ACCOUNT: StoredAccount = {
  username: 'admin',
  passwordHash: 'password123',
  name: 'Zafar Iqbal',
  email: 'mebadprince@gmail.com',
  role: 'Owner',
  avatarColor: 'from-blue-600 to-indigo-600',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load accounts from localStorage or seed with default
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading accounts storage:', e);
    }
    return [DEFAULT_PRIMARY_ACCOUNT];
  });

  // Toggle for whether login is strictly required
  const [requireAuth, setRequireAuth] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(REQUIRE_AUTH_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      // Default to true
    }
    return true;
  });

  // Current session user
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // No active session
    }
    return null;
  });

  // Sync accounts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(storedAccounts));
    } catch (e) {
      console.error('Failed to save accounts:', e);
    }
  }, [storedAccounts]);

  // Sync session to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to update session:', e);
    }
  }, [currentUser]);

  // Sync requireAuth to localStorage
  const toggleRequireAuth = (require: boolean) => {
    setRequireAuth(require);
    try {
      localStorage.setItem(REQUIRE_AUTH_KEY, JSON.stringify(require));
    } catch (e) {
      console.error('Failed to save requireAuth:', e);
    }
  };

  const login = (identifier: string, password: string): { success: boolean; message: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Please enter both username and password.' };
    }

    // Match by username or email
    const matched = storedAccounts.find(
      (acc) =>
        acc.username.toLowerCase() === cleanId ||
        (acc.email && acc.email.toLowerCase() === cleanId)
    );

    if (!matched) {
      return {
        success: false,
        message: 'Invalid username or password. Default username is "admin".',
      };
    }

    if (matched.passwordHash !== cleanPass) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const { passwordHash: _, ...publicUser } = matched;
    setCurrentUser(publicUser);
    return { success: true, message: `Welcome back, ${publicUser.name}!` };
  };

  const registerUser = (
    username: string,
    password: string,
    name: string,
    role: 'Owner' | 'Manager' | 'Staff',
    email?: string
  ): { success: boolean; message: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanName = name.trim();

    if (!cleanUser || cleanUser.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters long.' };
    }

    if (!cleanPass || cleanPass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    if (!cleanName) {
      return { success: false, message: 'Please provide a full display name.' };
    }

    const exists = storedAccounts.some((acc) => acc.username.toLowerCase() === cleanUser);
    if (exists) {
      return { success: false, message: `Username "${cleanUser}" is already taken.` };
    }

    const colors = [
      'from-blue-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-pink-600',
      'from-amber-600 to-orange-600',
    ];
    const randomColor = colors[storedAccounts.length % colors.length];

    const newAccount: StoredAccount = {
      username: cleanUser,
      passwordHash: cleanPass,
      name: cleanName,
      email: email ? email.trim().toLowerCase() : undefined,
      role,
      avatarColor: randomColor,
    };

    setStoredAccounts((prev) => [...prev, newAccount]);
    const { passwordHash: _, ...publicUser } = newAccount;
    setCurrentUser(publicUser);

    return { success: true, message: `User "${cleanUser}" created and logged in successfully!` };
  };

  const updatePassword = (
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently logged in.' };
    }

    const cleanNew = newPassword.trim();
    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }

    const accountIndex = storedAccounts.findIndex(
      (a) => a.username.toLowerCase() === currentUser.username.toLowerCase()
    );

    if (accountIndex === -1) {
      return { success: false, message: 'User account not found.' };
    }

    if (storedAccounts[accountIndex].passwordHash !== currentPassword.trim()) {
      return { success: false, message: 'Current password does not match.' };
    }

    setStoredAccounts((prev) => {
      const updated = [...prev];
      updated[accountIndex] = {
        ...updated[accountIndex],
        passwordHash: cleanNew,
      };
      return updated;
    });

    return { success: true, message: 'Password updated successfully!' };
  };

  const updateUsername = (newUsername: string): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently logged in.' };
    }

    const cleanNew = newUsername.trim().toLowerCase();
    if (!cleanNew || cleanNew.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters long.' };
    }

    if (cleanNew === currentUser.username.toLowerCase()) {
      return { success: true, message: 'Username is unchanged.' };
    }

    const exists = storedAccounts.some((a) => a.username.toLowerCase() === cleanNew);
    if (exists) {
      return { success: false, message: `Username "${cleanNew}" is already taken.` };
    }

    setStoredAccounts((prev) =>
      prev.map((acc) =>
        acc.username.toLowerCase() === currentUser.username.toLowerCase()
          ? { ...acc, username: cleanNew }
          : acc
      )
    );

    setCurrentUser((prev) => (prev ? { ...prev, username: cleanNew } : null));
    return { success: true, message: `Username changed to "${cleanNew}".` };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const accounts: AuthUser[] = storedAccounts.map(({ passwordHash: _, ...user }) => user);
  const isAuthenticated = !requireAuth || currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        requireAuth,
        accounts,
        login,
        registerUser,
        updatePassword,
        updateUsername,
        toggleRequireAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
