import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Tu nombre es muy corto").max(80),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72)
    .regex(/[A-Za-z]/, "Debe incluir una letra")
    .regex(/[0-9]/, "Debe incluir un número"),
  storeName: z.string().min(2, "Nombre de tienda requerido").max(80),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
