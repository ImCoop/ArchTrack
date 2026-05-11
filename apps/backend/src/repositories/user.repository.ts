import type { RefreshTokenRecord, User } from '../types/auth.js';
import { id, instantRepository, now } from './instant.repository.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  departmentId?: string;
  googleId?: string;
  googleRefreshToken?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: User['role'];
  departmentId?: string;
  googleId?: string;
  googleRefreshToken?: string;
}

export const userRepository = {
  async create(input: CreateUserInput) {
    const timestamp = now();
    const user: User = {
      id: id(),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await instantRepository.upsert<User>('users', user.id, user);
    return user;
  },

  findByEmail(email: string) {
    return instantRepository.findOneBy<User>('users', { email });
  },

  findById(userId: string) {
    return instantRepository.findById<User>('users', userId);
  },

  findByGoogleId(googleId: string) {
    return instantRepository.findOneBy<User>('users', { googleId });
  },

  async list(filters?: { search?: string; role?: User['role']; departmentId?: string }) {
    const users = await instantRepository.list<User>('users');
    const search = filters?.search?.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        [user.email, user.firstName, user.lastName, user.role, user.departmentId ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search);
      const matchesRole = !filters?.role || user.role === filters.role;
      const matchesDepartment = !filters?.departmentId || user.departmentId === filters.departmentId;

      return matchesSearch && matchesRole && matchesDepartment;
    });
  },

  async update(userId: string, input: UpdateUserInput) {
    const existing = await this.findById(userId);

    if (!existing) {
      return undefined;
    }

    const updated: User = {
      ...existing,
      ...input,
      updatedAt: now(),
    };

    await instantRepository.upsert<User>('users', userId, updated);
    return updated;
  },

  delete(userId: string) {
    return instantRepository.delete('users', userId);
  },

  async createRefreshToken(input: Omit<RefreshTokenRecord, 'id' | 'createdAt'>) {
    const record: RefreshTokenRecord = {
      id: id(),
      createdAt: now(),
      ...input,
    };

    await instantRepository.upsert<RefreshTokenRecord>('refreshTokens', record.id, record);
    return record;
  },

  findRefreshTokenByHash(tokenHash: string) {
    return instantRepository.findOneBy<RefreshTokenRecord>('refreshTokens', { tokenHash });
  },

  async revokeRefreshToken(recordId: string, replacedByTokenId?: string) {
    const existing = await instantRepository.findById<RefreshTokenRecord>('refreshTokens', recordId);

    if (!existing) {
      return;
    }

    await instantRepository.upsert<RefreshTokenRecord>('refreshTokens', recordId, {
      ...existing,
      revokedAt: now(),
      replacedByTokenId,
    });
  },
};
