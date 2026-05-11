import { z } from 'zod';
import { roles } from '../types/auth.js';
export const listUsersSchema = z.object({
    search: z.string().optional(),
    role: z.enum(roles).optional(),
    departmentId: z.string().optional(),
});
export const createUserSchema = z.object({
    email: z.string().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    role: z.enum(roles),
    departmentId: z.string().optional(),
});
export const updateUserSchema = z.object({
    email: z.string().email().transform((value) => value.toLowerCase()).optional(),
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    role: z.enum(roles).optional(),
    departmentId: z.string().optional(),
});
