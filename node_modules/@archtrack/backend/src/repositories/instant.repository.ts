import crypto from 'node:crypto';

import { instantDb } from '../config/instant.js';
import { HttpError } from '../utils/http-error.js';

type EntityName =
  | 'users'
  | 'refreshTokens'
  | 'customers'
  | 'projects'
  | 'tasks'
  | 'documents'
  | 'timeEntries'
  | 'quotes'
  | 'invoices'
  | 'notifications'
  | 'notificationPreferences'
  | 'emailQueue';

type RecordValue = { id: string };

const db = () => {
  if (!instantDb) {
    throw new HttpError(503, 'InstantDB is not configured.');
  }

  return instantDb as unknown as {
    query(query: Record<string, unknown>): Promise<Record<string, RecordValue[]>>;
    transact(transactions: unknown | unknown[]): Promise<unknown>;
    tx: Record<string, Record<string, { update(input: Record<string, unknown>): unknown; delete(): unknown }>>;
  };
};

const stripUndefined = (input: object) =>
  Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));

export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();

export const instantRepository = {
  async list<T extends RecordValue>(entity: EntityName) {
    const data = await db().query({ [entity]: {} });
    return (data[entity] ?? []) as T[];
  },

  async findById<T extends RecordValue>(entity: EntityName, recordId: string) {
    const data = await db().query({ [entity]: { $: { where: { id: recordId } } } });
    return (data[entity]?.[0] as T | undefined) ?? undefined;
  },

  async findOneBy<T extends RecordValue>(entity: EntityName, where: Record<string, unknown>) {
    const data = await db().query({ [entity]: { $: { where } } });
    return (data[entity]?.[0] as T | undefined) ?? undefined;
  },

  async upsert<T extends RecordValue>(entity: EntityName, recordId: string, input: object) {
    await db().transact(db().tx[entity][recordId].update(stripUndefined(input)));
    return this.findById<T>(entity, recordId);
  },

  async delete(entity: EntityName, recordId: string) {
    const existing = await this.findById(entity, recordId);
    if (!existing) return false;
    await db().transact(db().tx[entity][recordId].delete());
    return true;
  },
};
