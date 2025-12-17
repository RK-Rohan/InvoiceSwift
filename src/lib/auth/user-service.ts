'use server';

import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export interface DbUser {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

async function getUsersCollection() {
  const db = await getDb();
  return db.collection<DbUser>('users');
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await getUsersCollection();
  return users.findOne({ email: normalizedEmail });
}

export async function createUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await getUsersCollection();
  const passwordHash = await bcrypt.hash(password, 12);

  const newUser: DbUser = {
    _id: new ObjectId(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date(),
  };

  await users.insertOne(newUser);
  return newUser;
}

export async function validateCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return user;
}
