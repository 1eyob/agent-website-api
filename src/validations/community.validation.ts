import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().min(2).max(100),
  photo: z.string(),
  description: z.string().min(10).max(500),
  highlights: z.array(z.string().min(2).max(100)).optional(),
  homeStyles: z.array(z.string().min(2).max(100)).optional(),
  link: z.string().url().optional(),
  agentId: z.string().uuid().optional(),
});

export const updateCommunitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  photo: z.string().optional(),
  description: z.string().min(10).max(500).optional(),
  highlights: z.array(z.string().min(2).max(100)).optional(),
  homeStyles: z.array(z.string().min(2).max(100)).optional(),
  link: z.string().url().optional(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
