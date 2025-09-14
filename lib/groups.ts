import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, deleteDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { Group } from "./types"

// Generate random join code
function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Deep clean function to remove all undefined values recursively
function deepClean(obj: any): any {
  if (obj === null || obj === undefined) return null
  if (Array.isArray(obj)) {
    return obj.map(deepClean).filter(item => item !== null && item !== undefined)
  }
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        const cleanedValue = deepClean(value)
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue
        }
      }
    }
    return cleaned
  }
  return obj
}

// Create a new group
export async function createGroup(
  name: string,
  description: string,
  adminId: string,
  adminName: string,
  maxParticipants?: number,
): Promise<string> {
  const joinCode = generateJoinCode()

  const groupData: Omit<Group, "id"> = {
    name,
    description,
    adminId,
    adminName,
    participants: [adminId],
    participantNames: { [adminId]: adminName },
    createdAt: new Date(),
    isActive: true,
    joinCode,
    maxParticipants,
  }

  const docRef = await addDoc(collection(db, "groups"), groupData)
  return docRef.id
}

// Join a group by code
export async function joinGroup(joinCode: string, userId: string, userName: string): Promise<boolean> {
  try {
    console.log("Attempting to join group with code:", joinCode, "userId:", userId, "userName:", userName)
    
    // Validate inputs
    if (!userId || userId === 'undefined') {
      throw new Error("ID de usuario no válido. Por favor, inicia sesión nuevamente.")
    }
    
    if (!joinCode || !userName) {
      throw new Error("Código de grupo y nombre de usuario son requeridos")
    }
    
    const groupsRef = collection(db, "groups")
    const q = query(groupsRef, where("joinCode", "==", joinCode), where("isActive", "==", true))
    const querySnapshot = await getDocs(q)

    console.log("Query result:", querySnapshot.docs.length, "groups found")

    if (querySnapshot.empty) {
      throw new Error("Código de grupo no válido o grupo inactivo")
    }

    const groupDoc = querySnapshot.docs[0]
    const group = groupDoc.data() as Group

    console.log("Group found:", group.name, "participants:", group.participants.length)

    if (group.participants.includes(userId)) {
      throw new Error("Ya eres miembro de este grupo")
    }

    if (group.maxParticipants && group.participants.length >= group.maxParticipants) {
      throw new Error("El grupo está lleno")
    }

    const updatedParticipants = [...group.participants, userId]
    const updatedParticipantNames = { ...group.participantNames, [userId]: userName }

    const cleanParticipantNames = deepClean(updatedParticipantNames)

    console.log("Updating group with new participants:", updatedParticipants.length)
    console.log("Clean participant names:", cleanParticipantNames)

    await updateDoc(doc(db, "groups", groupDoc.id), {
      participants: updatedParticipants,
      participantNames: cleanParticipantNames,
    })

    console.log("Successfully joined group:", group.name)
    return true
  } catch (error) {
    console.error("Error joining group:", error)
    throw error
  }
}

// Get user's groups
export async function getUserGroups(userId: string): Promise<Group[]> {
  const groupsRef = collection(db, "groups")
  const q = query(groupsRef, where("participants", "array-contains", userId))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }) as Group,
  )
}

// Get group by ID
export async function getGroup(groupId: string): Promise<Group | null> {
  const groupDoc = await getDoc(doc(db, "groups", groupId))

  if (!groupDoc.exists()) {
    return null
  }

  return {
    id: groupDoc.id,
    ...groupDoc.data(),
  } as Group
}

// Leave a group
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Grupo no encontrado")
  }

  if (group.adminId === userId) {
    throw new Error("El administrador no puede abandonar el grupo")
  }

  const updatedParticipants = group.participants.filter((id) => id !== userId)
  const updatedParticipantNames = { ...group.participantNames }
  delete updatedParticipantNames[userId]

  const cleanParticipantNames = deepClean(updatedParticipantNames)

  await updateDoc(doc(db, "groups", groupId), {
    participants: updatedParticipants,
    participantNames: cleanParticipantNames,
  })
}

// Delete a group (admin only)
export async function deleteGroup(groupId: string, adminId: string): Promise<void> {
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Grupo no encontrado")
  }

  if (group.adminId !== adminId) {
    throw new Error("Solo el administrador puede eliminar el grupo")
  }

  // Eliminar el grupo completamente de Firestore
  await deleteDoc(doc(db, "groups", groupId))
}
