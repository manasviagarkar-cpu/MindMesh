// Zero-dependency Local Storage Database representing Firestore Collections

const STORAGE_KEYS = {
  TASKS: 'mindmesh_local_tasks',
  HABITS: 'mindmesh_local_habits',
  RELATIONSHIPS: 'mindmesh_local_relationships',
  CHATS: 'mindmesh_local_chats',
  PROFILE: 'mindmesh_local_profile',
};

// Seed values
const SEED_RELATIONSHIPS = [
  { id: 'rel_1', name: 'Sarah (Mom)', type: 'Family', lastConnected: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), emoji: '👩' },
  { id: 'rel_2', name: 'Alex', type: 'Friend', lastConnected: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), emoji: '🧑' },
  { id: 'rel_3', name: 'Dr. Evelyn (Mentor)', type: 'Professional', lastConnected: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), emoji: '🧙‍♀️' },
];

const SEED_TASKS = [
  { id: 't_1', task: 'Design new presentation deck', priority: 'HIGH', category: 'work', estimatedHours: 3, done: false, deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], createdAt: new Date().toISOString() },
  { id: 't_2', task: 'Morning workout session', priority: 'MEDIUM', category: 'health', estimatedHours: 1, done: false, deadline: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
  { id: 't_3', task: 'Buy groceries', priority: 'LOW', category: 'personal', estimatedHours: 1, done: true, deadline: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
];

const SEED_PROFILE = {
  displayName: 'Guest Explorer',
  email: 'guest@mindmesh.local',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  notifications: { email: true, push: false },
};

function getRaw(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Seed on first run
      if (key === STORAGE_KEYS.RELATIONSHIPS) {
        saveRaw(key, SEED_RELATIONSHIPS);
        return SEED_RELATIONSHIPS;
      }
      if (key === STORAGE_KEYS.TASKS) {
        saveRaw(key, SEED_TASKS);
        return SEED_TASKS;
      }
      if (key === STORAGE_KEYS.PROFILE) {
        saveRaw(key, SEED_PROFILE);
        return SEED_PROFILE;
      }
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveRaw(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Local Storage write error:', err);
  }
}

// Helper: Generates unique ID
const genId = () => Math.random().toString(36).substring(2, 11);

// Database Methods mimicking Firestore collections (all return Promises for drop-in compatibility)
export const localDb = {
  // --- Tasks ---
  getTasks: async () => {
    return getRaw(STORAGE_KEYS.TASKS);
  },

  addTask: async (taskData) => {
    const tasks = getRaw(STORAGE_KEYS.TASKS);
    const newTask = {
      id: genId(),
      done: false,
      createdAt: new Date().toISOString(),
      ...taskData,
    };
    tasks.push(newTask);
    saveRaw(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },

  updateTask: async (id, updates) => {
    const tasks = getRaw(STORAGE_KEYS.TASKS);
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveRaw(STORAGE_KEYS.TASKS, updated);
    return true;
  },

  deleteTask: async (id) => {
    const tasks = getRaw(STORAGE_KEYS.TASKS);
    const filtered = tasks.filter((t) => t.id !== id);
    saveRaw(STORAGE_KEYS.TASKS, filtered);
    return true;
  },

  // --- Habits ---
  getHabits: async () => {
    return getRaw(STORAGE_KEYS.HABITS, {});
  },

  saveHabitsForDate: async (dateStr, habitData) => {
    const habits = getRaw(STORAGE_KEYS.HABITS, {});
    habits[dateStr] = { ...habits[dateStr], ...habitData };
    saveRaw(STORAGE_KEYS.HABITS, habits);
    return habits[dateStr];
  },

  // --- Relationships ---
  getRelationships: async () => {
    return getRaw(STORAGE_KEYS.RELATIONSHIPS);
  },

  addRelationship: async (relData) => {
    const rels = getRaw(STORAGE_KEYS.RELATIONSHIPS);
    const newRel = {
      id: genId(),
      ...relData,
    };
    rels.push(newRel);
    saveRaw(STORAGE_KEYS.RELATIONSHIPS, rels);
    return newRel;
  },

  updateRelationship: async (id, updates) => {
    const rels = getRaw(STORAGE_KEYS.RELATIONSHIPS);
    const updated = rels.map((r) => (r.id === id ? { ...r, ...updates } : r));
    saveRaw(STORAGE_KEYS.RELATIONSHIPS, updated);
    return true;
  },

  deleteRelationship: async (id) => {
    const rels = getRaw(STORAGE_KEYS.RELATIONSHIPS);
    const filtered = rels.filter((r) => r.id !== id);
    saveRaw(STORAGE_KEYS.RELATIONSHIPS, filtered);
    return true;
  },

  // --- Chat History ---
  getChats: async () => {
    return getRaw(STORAGE_KEYS.CHATS).map((c) => ({
      ...c,
      timestamp: c.timestamp ? new Date(c.timestamp) : new Date(),
    }));
  },

  addChat: async (chatData) => {
    const chats = getRaw(STORAGE_KEYS.CHATS);
    const newChat = {
      id: genId(),
      timestamp: new Date().toISOString(),
      ...chatData,
    };
    chats.push(newChat);
    saveRaw(STORAGE_KEYS.CHATS, chats);
    return newChat;
  },

  clearChats: async () => {
    saveRaw(STORAGE_KEYS.CHATS, []);
    return true;
  },

  // --- Profile ---
  getProfile: async () => {
    return getRaw(STORAGE_KEYS.PROFILE, SEED_PROFILE);
  },

  saveProfile: async (profileData) => {
    saveRaw(STORAGE_KEYS.PROFILE, profileData);
    return profileData;
  },
};
