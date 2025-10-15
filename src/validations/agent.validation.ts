import { z } from "zod";
import { AgentPackage, Theme } from "@prisma/client";

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
  theme: z.nativeEnum(Theme).optional(),
  bio: z.string().max(2000).optional(),
  title: z.string().max(100).optional(),
  package_name: z.nativeEnum(AgentPackage).optional(),
  phone: z.string(),
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
  instagramUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  linkedInUrl: z.string().url().optional(),
  blogUrl: z.string().optional(),

  // LuxVT API fields
  luxvtId: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  license: z.string().max(50).optional(),
  website: z.string().optional(),
  isElite: z.boolean().optional(),
  brokerage: z.string().max(200).optional(),
  agentGrade: z.string().max(50).optional(),
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
