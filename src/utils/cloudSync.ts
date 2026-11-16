import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { createSeedHabits, createSeedTasks } from '../data/seed';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AppThemeId, DiaryEntry, Habit, Task } from '../types';
import { normalizeLegacyHabit } from './habits';
import { DiaryAuthRecord } from './storage';

export interface CloudUserProfile {
  uid: string;
  email?: string;
  displayName: string;
  theme: AppThemeId;
}

export async function ensureUserProfile(
  user: User,
  fallbackTheme: AppThemeId
): Promise<CloudUserProfile> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (snap.exists()) {
    const data = snap.data();
    const theme: AppThemeId =
      data.theme === 'classic' ||
      data.theme === 'ocean' ||
      data.theme === 'nature' ||
      data.theme === 'royal'
        ? data.theme
        : fallbackTheme;
    return {
      uid: user.uid,
      email: typeof data.email === 'string' ? data.email : user.email ?? undefined,
      displayName:
        typeof data.displayName === 'string' && data.displayName.trim()
          ? data.displayName
          : user.displayName || user.email?.split('@')[0] || 'Stride Member',
      theme,
    };
  }

  const displayName = (
    user.displayName ||
    user.email?.split('@')[0] ||
    'Stride Member'
  ).slice(0, 80);

  const profilePayload: Record<string, unknown> = {
    uid: user.uid,
    displayName,
    theme: fallbackTheme,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (user.email) {
    profilePayload.email = user.email.slice(0, 320);
  }

  try {
    await setDoc(userRef, profilePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }

  // Seed starter habits and tasks only for brand-new accounts
  const habitsQuery = query(
    collection(db, 'users', user.uid, 'habits'),
    where('userId', '==', user.uid)
  );
  const tasksQuery = query(
    collection(db, 'users', user.uid, 'tasks'),
    where('userId', '==', user.uid)
  );

  let existingHabits;
  let existingTasks;
  try {
    [existingHabits, existingTasks] = await Promise.all([
      getDocs(habitsQuery),
      getDocs(tasksQuery),
    ]);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/habits`);
  }

  if (existingHabits.empty && existingTasks.empty) {
    const batch = writeBatch(db);
    for (const h of createSeedHabits()) {
      batch.set(doc(db, 'users', user.uid, 'habits', h.id), {
        id: h.id,
        userId: user.uid,
        title: h.title,
        category: h.category,
        targetCount: h.targetCount,
        unit: h.unit,
        accentColor: h.accentColor,
        logs: h.logs,
        createdAt: h.createdAt,
        updatedAt: serverTimestamp(),
      });
    }
    for (const t of createSeedTasks()) {
      const taskDoc: Record<string, unknown> = {
        id: t.id,
        userId: user.uid,
        title: t.title,
        category: t.category,
        priority: t.priority,
        completed: t.completed,
        createdAt: t.createdAt,
        updatedAt: serverTimestamp(),
      };
      if (t.dueDate) {
        taskDoc.dueDate = t.dueDate;
      }
      batch.set(doc(db, 'users', user.uid, 'tasks', t.id), taskDoc);
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/habits`);
    }
  }

  return {
    uid: user.uid,
    email: user.email ?? undefined,
    displayName,
    theme: fallbackTheme,
  };
}

export async function saveCloudTheme(
  userId: string,
  displayName: string,
  email: string | null,
  theme: AppThemeId
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const payload: Record<string, unknown> = {
      uid: userId,
      displayName: (displayName || 'Stride Member').slice(0, 80),
      theme,
      updatedAt: serverTimestamp(),
    };
    if (email) {
      payload.email = email.slice(0, 320);
    }
    await updateDoc(doc(db, 'users', userId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserWorkspace(
  userId: string,
  callbacks: {
    onHabits: (habits: Habit[]) => void;
    onTasks: (tasks: Task[]) => void;
    onDiaryEntries: (entries: DiaryEntry[]) => void;
    onDiaryAuth: (auth: DiaryAuthRecord | null) => void;
  }
): Unsubscribe {
  const habitsPath = `users/${userId}/habits`;
  const tasksPath = `users/${userId}/tasks`;
  const diaryPath = `users/${userId}/diary`;
  const diaryLockPath = `users/${userId}/security/diaryLock`;

  const habitsQuery = query(
    collection(db, 'users', userId, 'habits'),
    where('userId', '==', userId)
  );
  const tasksQuery = query(
    collection(db, 'users', userId, 'tasks'),
    where('userId', '==', userId)
  );
  const diaryQuery = query(
    collection(db, 'users', userId, 'diary'),
    where('userId', '==', userId)
  );

  const unsubHabits = onSnapshot(
    habitsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => normalizeLegacyHabit(d.data() as Habit));
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callbacks.onHabits(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, habitsPath)
  );

  const unsubTasks = onSnapshot(
    tasksQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Task);
      callbacks.onTasks(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, tasksPath)
  );

  const unsubDiary = onSnapshot(
    diaryQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as DiaryEntry);
      callbacks.onDiaryEntries(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, diaryPath)
  );

  const unsubDiaryLock = onSnapshot(
    doc(db, 'users', userId, 'security', 'diaryLock'),
    (snapshot) => {
      if (!snapshot.exists()) {
        callbacks.onDiaryAuth(null);
      } else {
        const data = snapshot.data();
        if (typeof data.salt === 'string' && typeof data.passwordHash === 'string') {
          callbacks.onDiaryAuth({
            salt: data.salt,
            passwordHash: data.passwordHash,
            updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
          });
        }
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, diaryLockPath)
  );

  return () => {
    unsubHabits();
    unsubTasks();
    unsubDiary();
    unsubDiaryLock();
  };
}

export async function createHabitCloud(userId: string, habit: Habit): Promise<void> {
  const path = `users/${userId}/habits/${habit.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'habits', habit.id), {
      id: habit.id,
      userId,
      title: habit.title,
      category: habit.category,
      targetCount: habit.targetCount,
      unit: habit.unit,
      accentColor: habit.accentColor,
      logs: habit.logs,
      createdAt: habit.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateHabitDetailsCloud(userId: string, habit: Habit): Promise<void> {
  const path = `users/${userId}/habits/${habit.id}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'habits', habit.id), {
      title: habit.title,
      category: habit.category,
      targetCount: habit.targetCount,
      unit: habit.unit,
      accentColor: habit.accentColor,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateHabitLogsCloud(userId: string, habit: Habit): Promise<void> {
  const path = `users/${userId}/habits/${habit.id}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'habits', habit.id), {
      logs: habit.logs,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteHabitCloud(userId: string, habitId: string): Promise<void> {
  const path = `users/${userId}/habits/${habitId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'habits', habitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createTaskCloud(userId: string, task: Task): Promise<void> {
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const payload: Record<string, unknown> = {
      id: task.id,
      userId,
      title: task.title,
      category: task.category,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.createdAt,
      updatedAt: serverTimestamp(),
    };
    if (task.dueDate) {
      payload.dueDate = task.dueDate;
    }
    await setDoc(doc(db, 'users', userId, 'tasks', task.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTaskCompletedCloud(
  userId: string,
  taskId: string,
  completed: boolean
): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
      completed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTaskPriorityCloud(
  userId: string,
  taskId: string,
  priority: Task['priority']
): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
      priority,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTaskCloud(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearCompletedTasksCloud(userId: string, taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return;
  const path = `users/${userId}/tasks`;
  try {
    const batch = writeBatch(db);
    for (const id of taskIds) {
      batch.delete(doc(db, 'users', userId, 'tasks', id));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDiaryEntryCloud(
  userId: string,
  entry: DiaryEntry,
  isUpdate: boolean
): Promise<void> {
  const path = `users/${userId}/diary/${entry.id}`;
  try {
    if (isUpdate) {
      await updateDoc(doc(db, 'users', userId, 'diary', entry.id), {
        date: entry.date,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        updatedAt: entry.updatedAt,
      });
    } else {
      await setDoc(doc(db, 'users', userId, 'diary', entry.id), {
        id: entry.id,
        userId,
        date: entry.date,
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
    }
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteDiaryEntryCloud(userId: string, entryId: string): Promise<void> {
  const path = `users/${userId}/diary/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'diary', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDiaryAuthCloud(
  userId: string,
  record: DiaryAuthRecord
): Promise<void> {
  const path = `users/${userId}/security/diaryLock`;
  try {
    await setDoc(doc(db, 'users', userId, 'security', 'diaryLock'), {
      userId,
      salt: record.salt,
      passwordHash: record.passwordHash,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearDiaryCloud(userId: string, entryIds: string[]): Promise<void> {
  const path = `users/${userId}/diary`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', userId, 'security', 'diaryLock'));
    for (const id of entryIds) {
      batch.delete(doc(db, 'users', userId, 'diary', id));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
