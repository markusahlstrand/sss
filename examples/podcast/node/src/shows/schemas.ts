import { z } from "zod";

// Request schemas
export const CreateShowSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description too long"),
  imageUrl: z.string().url().nullable(),
});

export const UpdateShowSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(2000).optional(),
  imageUrl: z.string().url().nullable().optional(),
});

// Response schemas
export const ShowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Pagination
export const PaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => Math.min(parseInt(val || "10"), 100))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "0"))
    .pipe(z.number().min(0)),
});

// Path parameters
export const ShowParamsSchema = z.object({
  show_id: z.string().uuid(),
});

// Types
export type CreateShow = z.infer<typeof CreateShowSchema>;
export type UpdateShow = z.infer<typeof UpdateShowSchema>;
export type Show = z.infer<typeof ShowSchema>;
export type ShowParams = z.infer<typeof ShowParamsSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
