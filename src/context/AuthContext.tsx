import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile } from "../types";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradePlan: (plan: "Free" | "Pro IV" | "Pro V") => Promise<void>;
  resetLimitsManually: () => Promise<void>;
  incrementUsage: (mode: "academic" | "non-academic") => Promise<void>;
  checkAndResetLimits: (currentProfile: UserProfile) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign In with Google
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google login failed", err);
      throw err;
    }
  };

  // Sign In with Email
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Email login failed", err);
      throw err;
    }
  };

  // Sign Up with Email
  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      const u = credential.user;
      
      // Initialize layout profile
      const defaultProfile: UserProfile = {
        uid: u.uid,
        name: name || email.split("@")[0],
        email: email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email.split("@")[0])}`,
        subscriptionPlan: "Free",
        academicUsageCount: 0,
        nonAcademicUsageCount: 0,
        lastUsageReset: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const path = `users/${u.uid}`;
      try {
        await setDoc(doc(db, "users", u.uid), defaultProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } catch (err) {
      console.error("Email sign up failed", err);
      throw err;
    }
  };

  // Logs out user and completes requirements
  const logout = async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setUser(null);
      localStorage.removeItem("dolver_theme"); // or keep theme but reset all state
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Upgrade Plan
  const upgradePlan = async (plan: "Free" | "Pro IV" | "Pro V") => {
    if (!user || !profile) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        subscriptionPlan: plan,
        // When upgrading, optionally give a fresh reset
        academicUsageCount: 0,
        nonAcademicUsageCount: 0,
        lastUsageReset: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Reset limits manually or automatically
  const resetLimitsManually = async () => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        academicUsageCount: 0,
        nonAcademicUsageCount: 0,
        lastUsageReset: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Check and potentially reset limits reactively
  const checkAndResetLimits = async (currentProfile: UserProfile): Promise<UserProfile> => {
    const lastReset = new Date(currentProfile.lastUsageReset).getTime();
    const now = Date.now();
    const fourHoursMs = 4 * 60 * 60 * 1000; // 4 hours in millisecond representation

    if (now - lastReset >= fourHoursMs) {
      const path = `users/${currentProfile.uid}`;
      try {
        const updatedFields = {
          academicUsageCount: 0,
          nonAcademicUsageCount: 0,
          lastUsageReset: new Date().toISOString(),
        };
        await updateDoc(doc(db, "users", currentProfile.uid), updatedFields);
        return {
          ...currentProfile,
          ...updatedFields,
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
    return currentProfile;
  };

  // Increment usage
  const incrementUsage = async (mode: "academic" | "non-academic") => {
    if (!user || !profile) return;
    const path = `users/${user.uid}`;

    // Reactive reset before increment
    const activeProfile = await checkAndResetLimits(profile);

    const isAcademic = mode === "academic";
    const currentCount = isAcademic ? activeProfile.academicUsageCount : activeProfile.nonAcademicUsageCount;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        [isAcademic ? "academicUsageCount" : "nonAcademicUsageCount"]: currentCount + 1,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to profile document changes reactively
  useEffect(() => {
    if (!user) return;

    const profileDocRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(profileDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        
        // Reactively check and reset limits if needed when loaded
        const verifiedProfile = await checkAndResetLimits(profileData);
        setProfile(verifiedProfile);
      } else {
        // Doc doesn't exist yet (first sign-in with Google)
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email || "",
          avatar: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || "User")}`,
          subscriptionPlan: "Free",
          academicUsageCount: 0,
          nonAcademicUsageCount: 0,
          lastUsageReset: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        
        const path = `users/${user.uid}`;
        try {
          await setDoc(profileDocRef, newProfile);
          setProfile(newProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        upgradePlan,
        resetLimitsManually,
        incrementUsage,
        checkAndResetLimits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
