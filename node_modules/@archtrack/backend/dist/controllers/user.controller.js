import { userService } from '../services/user.service.js';
import { createUserSchema, listUsersSchema, updateUserSchema } from '../utils/user.schemas.js';
const getUserIdParam = (request) => {
    const id = request.params.id;
    return Array.isArray(id) ? id[0] : id;
};
export const userController = {
    async list(request, response) {
        const filters = listUsersSchema.parse(request.query);
        const users = await userService.list(filters);
        response.json({ users });
    },
    async create(request, response) {
        const input = createUserSchema.parse(request.body);
        const user = await userService.create(input);
        response.status(201).json({ user });
    },
    async update(request, response) {
        const input = updateUserSchema.parse(request.body);
        const user = await userService.update(getUserIdParam(request), input);
        response.json({ user });
    },
    async delete(request, response) {
        await userService.delete(getUserIdParam(request), request.user.id);
        response.status(204).send();
    },
};
