import { z } from "zod";

export const createAgentSchema = z.object({
  subdomain: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Subdomain can only contain lowercase letters, numbers, and hyphens",
    }),
  fullName: z.string().min(2).max(100),
  profilePhoto: z.string().optional(),
  heroTitle: z.string().max(100).optional(),
  heroSubtitle: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  title: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .default("+1234567890"),
  email: z.string().email(),
  officeHours: z.object({
    monday: z.object({
      start: z.string(),
      end: z.string(),
      closed: z.boolean(),
    }),
    tuesday: z.object({
      start: z.string(),
      end: z.string(),
      closed: z.boolean(),
    }),
    wednesday: z.object({
      start: z.string(),
      end: z.string(),
      closed: z.boolean(),
    }),
    thursday: z.object({
      start: z.string(),
      end: z.string(),
      closed: z.boolean(),
    }),
    friday: z.object({
      start: z.string(),
      end: z.string(),
      closed: z.boolean(),
    }),
    saturday: z.object({
      start: z.string(),
      end: z.string(),
      closed: z.boolean(),
    }),
    sunday: z.object({
      start: z.string(),
      end: z.string(),
      closed: z.boolean(),
    }),
  }),
  logo: z.string().optional(),
  heroImage: z.string().optional(),
  heroVideo: z.string().optional(),
  instagramUrl: z.string().optional(),
  blogUrl: z.string().optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const createTestimonialSchema = z.object({
  name: z.string().min(2).max(200),
  content: z.string().min(5).max(2000),
  agentId: z.string().uuid(),
});

export const updateTestimonialSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(200).optional(),
  content: z.string().min(5).max(2000).optional(),
});

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
