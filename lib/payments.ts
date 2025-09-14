import { doc, updateDoc, addDoc, collection, getDocs, query, orderBy, where, getDoc } from "firebase/firestore"
import { db } from "./firebase"

export interface PaymentRequest {
  id?: string
  userId: string
  userEmail: string
  userName: string
  amount: number
  status: "pending" | "approved" | "rejected"
  paymentMethod: "transfer"
  transferDetails?: {
    bankName: string
    accountHolder: string
    transferDate: string
    referenceNumber: string
  }
  createdAt: Date
  processedAt?: Date
  processedBy?: string
}

// Submit payment request for admin upgrade
export async function submitPaymentRequest(
  userId: string,
  userEmail: string,
  userName: string,
  transferDetails: {
    bankName: string
    accountHolder: string
    transferDate: string
    referenceNumber: string
  },
): Promise<string> {
  const paymentRequest: Omit<PaymentRequest, "id"> = {
    userId,
    userEmail,
    userName,
    amount: 10000, // $10,000 ARS (example amount)
    status: "pending",
    paymentMethod: "transfer",
    transferDetails,
    createdAt: new Date(),
  }

  const docRef = await addDoc(collection(db, "paymentRequests"), paymentRequest)
  return docRef.id
}

// Upgrade user to admin (after payment approval)
export async function upgradeUserToAdmin(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId)

  await updateDoc(userRef, {
    role: "admin",
    upgradedAt: new Date(),
  })
}

// Check if user has pending payment request
export async function hasPendingPayment(userId: string): Promise<boolean> {
  const q = query(
    collection(db, "paymentRequests"),
    where("userId", "==", userId),
    where("status", "==", "pending")
  )
  const snapshot = await getDocs(q)
  return !snapshot.empty
}

// Get all pending payment requests (for super admin)
export async function getPendingPaymentRequests(): Promise<PaymentRequest[]> {
  const q = query(
    collection(db, "paymentRequests"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    processedAt: doc.data().processedAt?.toDate(),
  })) as PaymentRequest[]
}

// Get all payment requests (for super admin)
export async function getAllPaymentRequests(): Promise<PaymentRequest[]> {
  const q = query(
    collection(db, "paymentRequests"),
    orderBy("createdAt", "desc")
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    processedAt: doc.data().processedAt?.toDate(),
  })) as PaymentRequest[]
}

// Approve payment request (super admin only)
export async function approvePaymentRequest(
  paymentId: string, 
  processedBy: string
): Promise<void> {
  const paymentRef = doc(db, "paymentRequests", paymentId)
  
  // Get payment request data
  const paymentDoc = await getDoc(paymentRef)
  if (!paymentDoc.exists()) {
    throw new Error("Payment request not found")
  }
  
  const paymentData = paymentDoc.data()
  const userId = paymentData.userId
  
  // Update payment request status
  await updateDoc(paymentRef, {
    status: "approved",
    processedAt: new Date(),
    processedBy: processedBy,
  })
  
  // Upgrade user to admin
  await upgradeUserToAdmin(userId)
}

// Reject payment request (super admin only)
export async function rejectPaymentRequest(
  paymentId: string, 
  processedBy: string
): Promise<void> {
  const paymentRef = doc(db, "paymentRequests", paymentId)
  
  await updateDoc(paymentRef, {
    status: "rejected",
    processedAt: new Date(),
    processedBy: processedBy,
  })
}
