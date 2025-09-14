// Script para crear el usuario super admin si no existe
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

const SUPER_ADMIN_EMAIL = "libreadmin@atenea.com"
const SUPER_ADMIN_PASSWORD = "libreadmin"

export async function ensureSuperAdminExists(): Promise<void> {
  try {
    // Try to sign in first
    await signInWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    console.log("Super admin user already exists")
  } catch (error: any) {
    if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
      try {
        // Create super admin user
        console.log("Creating super admin user...")
        const { user } = await createUserWithEmailAndPassword(auth, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
        
        // Create user profile in Firestore
        const userProfile = {
          uid: user.uid,
          email: SUPER_ADMIN_EMAIL,
          role: "superadmin",
          displayName: "Super Admin",
          createdAt: new Date(),
        }
        
        await setDoc(doc(db, "users", user.uid), userProfile)
        console.log("Super admin user created successfully")
      } catch (createError) {
        console.error("Error creating super admin:", createError)
        throw createError
      }
    } else {
      console.error("Unexpected error:", error)
      throw error
    }
  }
}


