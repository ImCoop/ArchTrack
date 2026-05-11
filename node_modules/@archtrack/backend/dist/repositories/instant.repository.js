import crypto from 'node:crypto';
import { instantDb } from '../config/instant.js';
import { HttpError } from '../utils/http-error.js';
const db = () => {
    if (!instantDb) {
        throw new HttpError(503, 'InstantDB is not configured.');
    }
    return instantDb;
};
const stripUndefined = (input) => Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
export const instantRepository = {
    async list(entity) {
        const data = await db().query({ [entity]: {} });
        return (data[entity] ?? []);
    },
    async findById(entity, recordId) {
        const data = await db().query({ [entity]: { $: { where: { id: recordId } } } });
        return data[entity]?.[0] ?? undefined;
    },
    async findOneBy(entity, where) {
        const data = await db().query({ [entity]: { $: { where } } });
        return data[entity]?.[0] ?? undefined;
    },
    async upsert(entity, recordId, input) {
        await db().transact(db().tx[entity][recordId].update(stripUndefined(input)));
        return this.findById(entity, recordId);
    },
    async delete(entity, recordId) {
        const existing = await this.findById(entity, recordId);
        if (!existing)
            return false;
        await db().transact(db().tx[entity][recordId].delete());
        return true;
    },
};
