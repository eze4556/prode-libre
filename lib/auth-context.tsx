"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "./firebase"
import { ensureSuperAdminExists } from "./ensure-super-admin"

interface UserProfile {
  uid: string
  email: string
  role: "admin" | "participant" | "superadmin"
  displayName?: string
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user)

        if (user) {
          // Check if user is super admin
          if (user.email === "libreadmin@atenea.com") {
            setUserProfile({
              uid: user.uid,
              email: user.email,
              role: "superadmin",
              displayName: "Super Admin",
              createdAt: new Date(),
            })
          } else {
            // Get user profile from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid))
            if (userDoc.exists()) {
              const data = userDoc.data()
              setUserProfile({
                uid: user.uid, // Always include the uid from Firebase Auth
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
              } as UserProfile)
            }
          }
        } else {
          setUserProfile(null)
        }
      } catch (error) {
        console.error("Auth state change error:", error)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // Check if it's the super admin email
      if (email === "libreadmin@atenea.com") {
        await ensureSuperAdminExists()
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role: "participant", // Default role
        displayName: displayName || email.split("@")[0],
        createdAt: new Date(),
      }

      await setDoc(doc(db, "users", user.uid), userProfile)
      setUserProfile(userProfile)
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
