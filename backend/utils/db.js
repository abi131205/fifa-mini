/**
 * @fileoverview Database connection and model management. Supports mongoose and a local in-memory fallback.
 */
import '../config.js';
import mongoose from 'mongoose';

let isConnected = false;
const mockModels = new Map();

/**
 * Checks if the application is using the real MongoDB database or the in-memory mock.
 * @returns {boolean} True if using MongoDB.
 */
export function isUsingMongoDB() {
  return isConnected;
}

/**
 * Connects to MongoDB Atlas if URI is provided, otherwise sets up the local memory DB.
 * @returns {Promise<boolean>} Connection success.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ No MONGODB_URI found in environment. Falling back to In-Memory simulation database.');
    return false;
  }

  try {
    // Disable bufferCommands to avoid queries hanging if connection drops
    mongoose.set('bufferCommands', false);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas successfully.');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
    console.warn('⚠️ Falling back to In-Memory simulation database.');
    return false;
  }
}

/**
 * Mock Query class replicating the Mongoose Query chain.
 */
class MockQuery {
  constructor(data) {
    this.data = [...data];
  }

  sort(by) {
    const key = typeof by === 'string' ? by.replace('-', '') : Object.keys(by)[0];
    const order = typeof by === 'string' ? (by.startsWith('-') ? -1 : 1) : by[key];
    
    this.data.sort((a, b) => {
      const valA = a[key] instanceof Date ? a[key].getTime() : a[key];
      const valB = b[key] instanceof Date ? b[key].getTime() : b[key];
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });
    return this;
  }

  limit(n) {
    this.data = this.data.slice(0, n);
    return this;
  }

  exec() {
    return Promise.resolve(this.data);
  }

  /* eslint-disable-next-line unicorn/no-thenable */
  then(onResolve, onReject) {
    return Promise.resolve(this.data).then(onResolve, onReject);
  }
}

/**
 * Mock Model class duplicating basic Mongoose CRUD operations in-memory.
 */
export class MockModel {
  constructor(name) {
    this.name = name;
    this.records = [];
  }

  async create(doc) {
    const newDoc = {
      _id: Math.random().toString(36).substring(7),
      ...doc,
      timestamp: doc.timestamp || new Date()
    };
    this.records.push(newDoc);
    return newDoc;
  }

  async insertMany(docs) {
    const newDocs = docs.map(doc => ({
      _id: Math.random().toString(36).substring(7),
      ...doc,
      timestamp: doc.timestamp || new Date()
    }));
    this.records.push(...newDocs);
    return newDocs;
  }

  find(filter = {}) {
    let filtered = this.records;
    if (Object.keys(filter).length > 0) {
      filtered = this.records.filter(r => {
        return Object.entries(filter).every(([k, v]) => {
          if (v && typeof v === 'object' && v.$gt) {
            return r[k] > v.$gt;
          }
          return r[k] === v;
        });
      });
    }
    return new MockQuery(filtered);
  }

  async deleteMany(filter = {}) {
    const initialCount = this.records.length;
    if (Object.keys(filter).length === 0) {
      this.records = [];
    } else {
      this.records = this.records.filter(r => {
        return !Object.entries(filter).every(([k, v]) => r[k] === v);
      });
    }
    return { deletedCount: initialCount - this.records.length };
  }
}

/**
 * Returns a model instance (either Mongoose Model or MockModel).
 * @param {string} name Model name.
 * @param {mongoose.Schema} schema Schema definition.
 * @returns {mongoose.Model|MockModel}
 */
export function getModel(name, schema) {
  if (isUsingMongoDB()) {
    return mongoose.models[name] || mongoose.model(name, schema);
  }
  
  if (!mockModels.has(name)) {
    mockModels.set(name, new MockModel(name));
  }
  return mockModels.get(name);
}
