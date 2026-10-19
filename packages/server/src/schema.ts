import { z } from 'zod';

export const anchorSchema = z.object({
  selector: z.string().min(1).max(2000),
  route: z.string().min(1).max(2000),
  offsetX: z.number().min(0).max(1),
  offsetY: z.number().min(0).max(1)
});

export const createThreadSchema = z.object({
  host: z.string().min(1).max(255),
  project: z.string().min(1).max(200),
  branch: z.string().min(1).max(200),
  author: z.string().min(1).max(200),
  body: z.string().min(1).max(10_000),
  anchor: anchorSchema
});

export const addCommentSchema = z.object({
  author: z.string().min(1).max(200),
  body: z.string().min(1).max(10_000)
});

export const updateThreadSchema = z.object({
  resolved: z.boolean()
});

export const listQuerySchema = z.object({
  host: z.string().min(1),
  project: z.string().min(1),
  branch: z.string().min(1),
  route: z.string().optional()
});

export type Anchor = z.infer<typeof anchorSchema>;
export type CreateThread = z.infer<typeof createThreadSchema>;
export type AddComment = z.infer<typeof addCommentSchema>;
