import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

interface User {
  id: string;
  username: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("flexgen_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const q = query(
      collection(db, "credentials"),
      where("username", "==", username),
      where("password", "==", password)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error("Invalid system credentials.");
    }

    const userData = snapshot.docs[0].data();
    const newUser = {
      id: snapshot.docs[0].id,
      username: userData.username,
      displayName: userData.username,
    };

    setUser(newUser);
    localStorage.setItem("flexgen_user", JSON.stringify(newUser));
  };

  const register = async (username: string, password: string) => {
    // Check if user exists
    const q = query(collection(db, "credentials"), where("username", "==", username));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("User already exists in distributed node.");
    }

    // Create credential
    const docRef = await addDoc(collection(db, "credentials"), {
      username,
      password, // Note: Insecure, but following user request for manual data storage
      createdAt: serverTimestamp()
    });

    const newUser = {
      id: docRef.id,
      username: username,
      displayName: username,
    };

    // Also add to content as requested before
    await addDoc(collection(db, "content"), {
      entityType: "users",
      data: {
        username: username,
        displayName: username,
        lastLogin: new Date().toISOString(),
        status: "active",
        provider: "manual"
      },
      ownerId: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    setUser(newUser);
    localStorage.setItem("flexgen_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("flexgen_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
