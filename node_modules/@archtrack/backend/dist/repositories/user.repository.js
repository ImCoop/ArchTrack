import { id, instantRepository, now } from './instant.repository.js';
export const userRepository = {
    async create(input) {
        const timestamp = now();
        const user = {
            id: id(),
            ...input,
            createdAt: timestamp,
            updatedAt: timestamp,
        };
        await instantRepository.upsert('users', user.id, user);
        return user;
    },
    findByEmail(email) {
        return instantRepository.findOneBy('users', { email });
    },
    findById(userId) {
        return instantRepository.findById('users', userId);
    },
    findByGoogleId(googleId) {
        return instantRepository.findOneBy('users', { googleId });
    },
    async list(filters) {
        const users = await instantRepository.list('users');
        const search = filters?.search?.trim().toLowerCase();
        return users.filter((user) => {
            const matchesSearch = !search ||
                [user.email, user.firstName, user.lastName, user.role, user.departmentId ?? '']
                    .join(' ')
                    .toLowerCase()
                    .includes(search);
            const matchesRole = !filters?.role || user.role === filters.role;
            const matchesDepartment = !filters?.departmentId || user.departmentId === filters.departmentId;
            return matchesSearch && matchesRole && matchesDepartment;
        });
    },
    async update(userId, input) {
        const existing = await this.findById(userId);
        if (!existing) {
            return undefined;
        }
        const updated = {
            ...existing,
            ...input,
            updatedAt: now(),
        };
        await instantRepository.upsert('users', userId, updated);
        return updated;
    },
    delete(userId) {
        return instantRepository.delete('users', userId);
    },
    async createRefreshToken(input) {
        const record = {
            id: id(),
            createdAt: now(),
            ...input,
        };
        await instantRepository.upsert('refreshTokens', record.id, record);
        return record;
    },
    findRefreshTokenByHash(tokenHash) {
        return instantRepository.findOneBy('refreshTokens', { tokenHash });
    },
    async revokeRefreshToken(recordId, replacedByTokenId) {
        const existing = await instantRepository.findById('refreshTokens', recordId);
        if (!existing) {
            return;
        }
        await instantRepository.upsert('refreshTokens', recordId, {
            ...existing,
            revokedAt: now(),
            replacedByTokenId,
        });
    },
};
