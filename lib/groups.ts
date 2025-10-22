import { collection, doc, addDoc, updateDoc, getDocs, getDoc, query, where, deleteDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { Group, GroupMembership, MembershipStatus } from "./types"

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
  requiresApproval: boolean = true,
): Promise<string> {
  console.log("createGroup called with:", { name, description, adminId, adminName, maxParticipants, requiresApproval })
  
  const joinCode = generateJoinCode()

  const groupData: Omit<Group, "id"> = {
    name,
    description,
    adminId,
    adminName,
    participants: [adminId],
    participantNames: { [adminId]: adminName },
    memberships: {
      [adminId]: {
        uid: adminId,
        userName: adminName,
        userEmail: '', // Se llenará cuando se obtenga del perfil
        status: 'approved',
        requestedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: adminId,
      }
    },
    createdAt: new Date(),
    isActive: true,
    joinCode,
    requiresApproval,
    // Solo incluir maxParticipants si no es undefined
    ...(maxParticipants !== undefined && { maxParticipants }),
  }

  console.log("Group data to save:", groupData)

  try {
    const docRef = await addDoc(collection(db, "groups"), groupData)
    console.log("Group created successfully with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creating group in Firestore:", error)
    throw error
  }
}

// Request to join a group by code
export async function requestToJoinGroup(joinCode: string, userId: string, userName: string, userEmail: string): Promise<{ success: boolean, requiresApproval: boolean, message: string }> {
  try {
    console.log("Attempting to join group with code:", joinCode, "userId:", userId, "userName:", userName)
    
    // Validate inputs
    if (!userId || userId === 'undefined') {
      throw new Error("ID de usuario no válido. Por favor, inicia sesión nuevamente.")
    }
    
    if (!joinCode || !userName || !userEmail) {
      throw new Error("Código de grupo, nombre de usuario y email son requeridos")
    }
    
    // Validar que el nombre no sea genérico
    if (userName.toLowerCase() === 'usuario' || userName.toLowerCase() === 'user') {
      throw new Error("Por favor, configura tu nombre de perfil en la configuración de la cuenta")
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

    // Verificar si ya es miembro
    if (group.participants.includes(userId)) {
      throw new Error("Ya eres miembro de este grupo")
    }

    // Verificar si ya tiene una solicitud pendiente
    if (group.memberships?.[userId]?.status === 'pending') {
      throw new Error("Ya tienes una solicitud pendiente para este grupo")
    }

    // Verificar límite de participantes
    if (group.maxParticipants && group.participants.length >= group.maxParticipants) {
      throw new Error("El grupo está lleno")
    }

    const membership: GroupMembership = {
      uid: userId,
      userName,
      userEmail,
      status: 'pending',
      requestedAt: new Date(),
    }

    const updatedMemberships = { ...group.memberships, [userId]: membership }

    await updateDoc(doc(db, "groups", groupDoc.id), {
      memberships: updatedMemberships,
    })

    console.log("Successfully requested to join group:", group.name)
    
    if (group.requiresApproval) {
      return {
        success: true,
        requiresApproval: true,
        message: "Solicitud enviada. El administrador revisará tu solicitud."
      }
    } else {
      // Si no requiere aprobación, agregar directamente
      return await approveMembership(groupDoc.id, userId, group.adminId)
    }
  } catch (error) {
    console.error("Error requesting to join group:", error)
    throw error
  }
}

// Approve a membership request
export async function approveMembership(groupId: string, userId: string, adminId: string): Promise<{ success: boolean, requiresApproval: boolean, message: string }> {
  try {
    const group = await getGroup(groupId)
    
    if (!group) {
      throw new Error("Grupo no encontrado")
    }

    if (group.adminId !== adminId) {
      throw new Error("Solo el administrador puede aprobar solicitudes")
    }

    const membership = group.memberships?.[userId]
    if (!membership) {
      throw new Error("Solicitud de membresía no encontrada")
    }

    if (membership.status !== 'pending') {
      throw new Error("Esta solicitud ya fue procesada")
    }

    // Verificar límite de participantes
    if (group.maxParticipants && group.participants.length >= group.maxParticipants) {
      throw new Error("El grupo está lleno")
    }

    // Actualizar membresía
    const updatedMembership: GroupMembership = {
      ...membership,
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminId,
    }

    // Agregar a participantes
    const updatedParticipants = [...group.participants, userId]
    const updatedParticipantNames = { ...group.participantNames, [userId]: membership.userName }
    const updatedMemberships = { ...group.memberships, [userId]: updatedMembership }

    await updateDoc(doc(db, "groups", groupId), {
      participants: updatedParticipants,
      participantNames: updatedParticipantNames,
      memberships: updatedMemberships,
    })

    return {
      success: true,
      requiresApproval: false,
      message: "Solicitud aprobada exitosamente"
    }
  } catch (error) {
    console.error("Error approving membership:", error)
    throw error
  }
}

// Reject a membership request
export async function rejectMembership(groupId: string, userId: string, adminId: string, reason?: string): Promise<void> {
  try {
    const group = await getGroup(groupId)
    
    if (!group) {
      throw new Error("Grupo no encontrado")
    }

    if (group.adminId !== adminId) {
      throw new Error("Solo el administrador puede rechazar solicitudes")
    }

    const membership = group.memberships?.[userId]
    if (!membership) {
      throw new Error("Solicitud de membresía no encontrada")
    }

    if (membership.status !== 'pending') {
      throw new Error("Esta solicitud ya fue procesada")
    }

    // Actualizar membresía
    const updatedMembership: GroupMembership = {
      ...membership,
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: adminId,
      rejectionReason: reason,
    }

    const updatedMemberships = { ...group.memberships, [userId]: updatedMembership }

    await updateDoc(doc(db, "groups", groupId), {
      memberships: updatedMemberships,
    })
  } catch (error) {
    console.error("Error rejecting membership:", error)
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

// Update participant name (admin only)
export async function updateParticipantName(groupId: string, userId: string, newName: string): Promise<void> {
  try {
    const group = await getGroup(groupId)
    
    if (!group) {
      throw new Error("Grupo no encontrado")
    }
    
    if (!group.participantNames?.[userId]) {
      throw new Error("Usuario no encontrado en el grupo")
    }
    
    // Validar que el nombre no sea genérico
    if (newName.toLowerCase() === 'usuario' || newName.toLowerCase() === 'user') {
      throw new Error("Por favor, ingresa un nombre real, no 'Usuario'")
    }
    
    const updatedParticipantNames = { ...group.participantNames, [userId]: newName }
    const cleanParticipantNames = deepClean(updatedParticipantNames)
    
    await updateDoc(doc(db, "groups", groupId), {
      participantNames: cleanParticipantNames,
    })
    
    console.log(`Successfully updated participant name: ${userId} -> ${newName}`)
  } catch (error) {
    console.error("Error updating participant name:", error)
    throw error
  }
}

// Fix "Usuario" names in all groups (admin only)
export async function fixUsuarioNames(): Promise<void> {
  try {
    console.log("Starting to fix 'Usuario' names in all groups...")
    
    const groupsRef = collection(db, "groups")
    const querySnapshot = await getDocs(groupsRef)
    
    let fixedCount = 0
    
    for (const groupDoc of querySnapshot.docs) {
      const group = groupDoc.data() as Group
      const participantNames = group.participantNames || {}
      
      let needsUpdate = false
      const updatedNames = { ...participantNames }
      
      // Buscar nombres "Usuario" y cambiarlos por "Participante"
      for (const [userId, userName] of Object.entries(participantNames)) {
        if (userName === 'Usuario') {
          updatedNames[userId] = 'Participante'
          needsUpdate = true
          fixedCount++
          console.log(`Fixed user ${userId} in group ${group.name}: Usuario -> Participante`)
        }
      }
      
      if (needsUpdate) {
        const cleanParticipantNames = deepClean(updatedNames)
        await updateDoc(doc(db, "groups", groupDoc.id), {
          participantNames: cleanParticipantNames,
        })
      }
    }
    
    console.log(`Fixed ${fixedCount} 'Usuario' names across all groups`)
  } catch (error) {
    console.error("Error fixing 'Usuario' names:", error)
    throw error
  }
}

// Get pending membership requests for a group
export async function getPendingMemberships(groupId: string, adminId: string): Promise<GroupMembership[]> {
  const group = await getGroup(groupId)
  
  if (!group) {
    throw new Error("Grupo no encontrado")
  }

  if (group.adminId !== adminId) {
    throw new Error("Solo el administrador puede ver las solicitudes")
  }

  const memberships = group.memberships || {}
  return Object.values(memberships).filter(membership => membership.status === 'pending')
}

// Get user's sent membership requests
export async function getUserMembershipRequests(userId: string): Promise<{group: Group, membership: GroupMembership}[]> {
  try {
    const groupsRef = collection(db, "groups")
    const q = query(groupsRef, where("isActive", "==", true))
    const querySnapshot = await getDocs(q)

    const userRequests: {group: Group, membership: GroupMembership}[] = []

    querySnapshot.docs.forEach(doc => {
      const group = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Group

      // Verificar si el usuario tiene una membresía en este grupo
      if (group.memberships && group.memberships[userId]) {
        const membership = group.memberships[userId]
        // Solo incluir solicitudes pendientes, aprobadas o rechazadas (no las que ya son miembros activos)
        if (membership.status === 'pending' || membership.status === 'approved' || membership.status === 'rejected') {
          userRequests.push({ group, membership })
        }
      }
    })

    return userRequests
  } catch (error) {
    console.error("Error getting user membership requests:", error)
    throw error
  }
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
