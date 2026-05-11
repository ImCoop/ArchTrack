import { userRepository } from '../repositories/user.repository.js';
import { HttpError } from '../utils/http-error.js';
import { hashPassword } from '../utils/password.js';
const toPublicUser = (user) => {
    const { passwordHash, googleRefreshToken, ...publicUser } = user;
    void passwordHash;
    void googleRefreshToken;
    return publicUser;
};
export const userService = {
    async list(filters) {
        const users = await userRepository.list(filters);
        return users.map(toPublicUser);
    },
    async create(input) {
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
    async update(id, input) {
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
    async delete(id, currentUserId) {
        if (id === currentUserId) {
            throw new HttpError(400, 'You cannot delete your own user account.');
        }
        const deleted = await userRepository.delete(id);
        if (!deleted) {
            throw new HttpError(404, 'User not found.');
        }
    },
};
