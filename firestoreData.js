import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

function collectionRef(name) {
  if (!db) throw new Error("Firebase is not configured. Add the values to .env and restart Vite.");
  return collection(db, name);
}

function recordFromSnapshot(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getRecords(name) {
  const recordsQuery = name === "queue"
    ? query(collectionRef(name), orderBy("createdAt", "asc"))
    : collectionRef(name);
  const snapshot = await getDocs(recordsQuery);
  return snapshot.docs.map(recordFromSnapshot);
}

export function watchRecords(name, onRecords, onError) {
  const recordsQuery = name === "queue"
    ? query(collectionRef(name), orderBy("createdAt", "asc"))
    : collectionRef(name);
  return onSnapshot(
    recordsQuery,
    (snapshot) => onRecords(snapshot.docs.map(recordFromSnapshot)),
    onError
  );
}

export async function addQueueEntry(entry) {
  const reference = await addDoc(collectionRef("queue"), {
    ...entry,
    createdAt: serverTimestamp(),
  });
  return { ...entry, id: reference.id };
}

export async function serveNextQueueEntry() {
  const queueSnapshot = await getDocs(
    query(collectionRef("queue"), orderBy("createdAt", "asc"))
  );
  const first = queueSnapshot.docs[0];
  if (!first) throw new Error("The queue is already empty.");

  return runTransaction(db, async (transaction) => {
    const current = await transaction.get(first.ref);
    if (!current.exists()) {
      throw new Error("The queue changed. Refresh and try again.");
    }
    transaction.delete(first.ref);
    return recordFromSnapshot(current);
  });
}

export async function addCampusStudent(student) {
  const existing = await getRecords("students");
  if (existing.some((record) =>
    record.rollNumber.toLowerCase() === student.rollNumber.toLowerCase()
  )) {
    throw new Error("A student with this roll number already exists.");
  }
  const reference = await addDoc(collectionRef("students"), student);
  return { ...student, id: reference.id };
}

export async function deleteCampusStudent(id) {
  await deleteDoc(doc(collectionRef("students"), id));
}

export async function saveResource(resource, id = null) {
  const existing = await getRecords("resources");
  if (existing.some((record) =>
    record.id !== id && record.name.toLowerCase() === resource.name.toLowerCase()
  )) {
    throw new Error("A resource with this name already exists.");
  }

  if (!id) {
    const newResource = { ...resource, available: resource.total };
    const reference = await addDoc(collectionRef("resources"), newResource);
    return { ...newResource, id: reference.id };
  }

  const reference = doc(collectionRef("resources"), id);
  return runTransaction(db, async (transaction) => {
    const current = await transaction.get(reference);
    if (!current.exists()) throw new Error("Resource not found.");
    const currentResource = current.data();
    const unitsInUse = currentResource.total - currentResource.available;
    if (resource.total < unitsInUse) {
      throw new Error("Total cannot be lower than the number of units in use.");
    }
    const updated = {
      ...resource,
      available: resource.total - unitsInUse,
    };
    transaction.set(reference, updated);
    return { ...updated, id };
  });
}

export async function deleteResource(id) {
  await deleteDoc(doc(collectionRef("resources"), id));
}

export async function toggleResourceAvailability(id) {
  const reference = doc(collectionRef("resources"), id);
  return runTransaction(db, async (transaction) => {
    const current = await transaction.get(reference);
    if (!current.exists()) throw new Error("Resource not found.");
    const resource = current.data();
    const available = resource.available > 0 ? resource.available - 1 : resource.total;
    transaction.update(reference, { available });
    return { ...resource, id, available };
  });
}

export async function addTask(task) {
  const reference = await addDoc(collectionRef("tasks"), {
    ...task,
    createdAt: serverTimestamp(),
  });
  return { ...task, id: reference.id };
}

export async function updateTask(task) {
  const { id, ...data } = task;
  await setDoc(doc(collectionRef("tasks"), id), data);
}

export async function deleteTask(id) {
  await deleteDoc(doc(collectionRef("tasks"), id));
}
