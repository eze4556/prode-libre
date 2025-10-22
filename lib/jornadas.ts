import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, getDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { Jornada } from "./types"

// Crear una nueva jornada
export async function createJornada(
  groupId: string,
  name: string,
  description: string,
  startDate: Date,
  endDate: Date,
  createdBy: string
): Promise<string> {
  try {
    const jornadaData = {
      groupId,
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      isActive: true,
      createdAt: new Date(),
      createdBy,
    }

    const docRef = await addDoc(collection(db, "jornadas"), jornadaData)
    console.log("Jornada creada con ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creando jornada:", error)
    throw new Error("No se pudo crear la jornada")
  }
}

// Obtener todas las jornadas de un grupo
export async function getJornadasByGroup(groupId: string): Promise<Jornada[]> {
  try {
    const q = query(
      collection(db, "jornadas"),
      where("groupId", "==", groupId),
      orderBy("startDate", "asc")
    )
    
    const querySnapshot = await getDocs(q)
    const jornadas: Jornada[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      try {
        const startDate = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate)
        const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate)
        
        // Crear fechas locales para evitar problemas de zona horaria
        const localStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0)
        const localEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0)
        
        jornadas.push({
          id: doc.id,
          ...data,
          startDate: localStartDate,
          endDate: localEndDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Jornada)
      } catch (error) {
        console.error(`Error procesando jornada ${doc.id}:`, error)
        // Agregar con fechas por defecto si hay error
        jornadas.push({
          id: doc.id,
          ...data,
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
        } as Jornada)
      }
    })
    
    return jornadas
  } catch (error) {
    console.error("Error obteniendo jornadas:", error)
    throw new Error("No se pudieron cargar las jornadas")
  }
}

// Obtener una jornada específica
export async function getJornada(jornadaId: string): Promise<Jornada | null> {
  try {
    const docRef = doc(db, "jornadas", jornadaId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      try {
        const startDate = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate)
        const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate)
        
        // Crear fechas locales para evitar problemas de zona horaria
        const localStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0)
        const localEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0)
        
        return {
          id: docSnap.id,
          ...data,
          startDate: localStartDate,
          endDate: localEndDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Jornada
      } catch (error) {
        console.error(`Error procesando jornada ${docSnap.id}:`, error)
        return {
          id: docSnap.id,
          ...data,
          startDate: new Date(),
          endDate: new Date(),
          createdAt: new Date(),
        } as Jornada
      }
    }
    
    return null
  } catch (error) {
    console.error("Error obteniendo jornada:", error)
    throw new Error("No se pudo cargar la jornada")
  }
}

// Actualizar una jornada
export async function updateJornada(
  jornadaId: string,
  updates: Partial<Pick<Jornada, 'name' | 'description' | 'startDate' | 'endDate' | 'isActive'>>
): Promise<void> {
  try {
    const jornadaRef = doc(db, "jornadas", jornadaId)
    await updateDoc(jornadaRef, updates)
    console.log("Jornada actualizada:", jornadaId)
  } catch (error) {
    console.error("Error actualizando jornada:", error)
    throw new Error("No se pudo actualizar la jornada")
  }
}

// Eliminar una jornada
export async function deleteJornada(jornadaId: string): Promise<void> {
  try {
    const jornadaRef = doc(db, "jornadas", jornadaId)
    await deleteDoc(jornadaRef)
    console.log("Jornada eliminada:", jornadaId)
  } catch (error) {
    console.error("Error eliminando jornada:", error)
    throw new Error("No se pudo eliminar la jornada")
  }
}

// Obtener jornadas activas de un grupo
export async function getActiveJornadasByGroup(groupId: string): Promise<Jornada[]> {
  try {
    const q = query(
      collection(db, "jornadas"),
      where("groupId", "==", groupId),
      where("isActive", "==", true),
      orderBy("startDate", "asc")
    )
    
    const querySnapshot = await getDocs(q)
    const jornadas: Jornada[] = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const startDate = data.startDate.toDate()
      const endDate = data.endDate.toDate()
      
      // Crear fechas locales para evitar problemas de zona horaria
      const localStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0)
      const localEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0, 0)
      
      jornadas.push({
        id: doc.id,
        ...data,
        startDate: localStartDate,
        endDate: localEndDate,
        createdAt: data.createdAt.toDate(),
      } as Jornada)
    })
    
    return jornadas
  } catch (error) {
    console.error("Error obteniendo jornadas activas:", error)
    throw new Error("No se pudieron cargar las jornadas activas")
  }
}

