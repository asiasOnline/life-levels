import { z } from "zod";

export const skillFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  
  icon: z
    .string()
    .min(1, "Icon is required"),
  
  categoryId: z
    .string()
    .min(1, "Category is required"),
  
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  
  characterIds: z
    .array(z.string())
    .optional()
    .default([]),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;