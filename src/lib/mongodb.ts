'use server';

import { Db, MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URL;
const dbName = process.env.DATABASE_NAME || 'invoice_swift';

if (!uri) {
  throw new Error('DATABASE_URL is not set. Please add it to your environment.');
}

const mongoUri = uri as string;

// Cache the connection across hot reloads in dev.
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};
let clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient> | undefined;

async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(mongoUri);
    globalWithMongo._mongoClientPromise = clientPromise;
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
