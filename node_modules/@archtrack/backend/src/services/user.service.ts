import { userRepository } from '../repositories/user.repository.js';
import type { PublicUser, User } from '../types/auth.js';
import { HttpError } from '../utils/http-error.js';
import { hashPassword } from '../utils/password.js';

const toPublicUser = (user: User): PublicUser => {
  const { passwordHash, googleRefreshToken, ...publicUser } = user;
  void passwordHash;
  void googleRefreshToken;

  return publicUser;
};

export const userService = {
  async list(filters?: { search?: string; role?: User['role']; departmentId?: string }) {
    const users = await userRepository.list(filters);
    return users.map(toPublicUser);
  },

  async create(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: User['role'];
    departmentId?: string;
  }) {
    const existing = await userRepository.findByEmail(input.email);

    if (existing) {
      throw new HttpError(409, 'A user with this email already exists.');
    }

    const user = await userRepository.create({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      departmentId: input.departmentId,
    });

    return toPublicUser(user);
  },

  async update(
    id: string,
    input: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: User['role'];
      departmentId?: string;
    },
  ) {
    if (input.email) {
      const existing = await userRepository.findByEmail(input.email);

      if (existing && existing.id !== id) {
        throw new HttpError(409, 'A user with this email already exists.');
      }
    }

    const user = await userRepository.update(id, input);

    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    return toPublicUser(user);
  },

  async delete(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new HttpError(400, 'You cannot delete your own user account.');
    }

    const deleted = await userRepository.delete(id);

    if (!deleted) {
      throw new HttpError(404, 'User not found.');
    }
  },
};
