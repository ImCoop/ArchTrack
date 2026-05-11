import type { Request, Response } from 'express';

import { userService } from '../services/user.service.js';
import { createUserSchema, listUsersSchema, updateUserSchema } from '../utils/user.schemas.js';

const getUserIdParam = (request: Request) => {
  const id = request.params.id;

  return Array.isArray(id) ? id[0] : id;
};

export const userController = {
  async list(request: Request, response: Response) {
    const filters = listUsersSchema.parse(request.query);
    const users = await userService.list(filters);

    response.json({ users });
  },

  async create(request: Request, response: Response) {
    const input = createUserSchema.parse(request.body);
    const user = await userService.create(input);

    response.status(201).json({ user });
  },

  async update(request: Request, response: Response) {
    const input = updateUserSchema.parse(request.body);
    const user = await userService.update(getUserIdParam(request), input);

    response.json({ user });
  },

  async delete(request: Request, response: Response) {
    await userService.delete(getUserIdParam(request), request.user!.id);

    response.status(204).send();
  },
};
