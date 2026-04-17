import { z } from "zod"

export const savedAddressSchema = z.object({
  label: z.string().min(1, "Dê um nome para o endereço (ex: Casa, Trabalho)"),
  full_name: z.string().min(3, "Nome completo é obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  zip_code: z.string().length(8, "CEP deve ter 8 dígitos"),
  street: z.string().min(2, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional().default(""),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
  is_default: z.boolean().optional().default(false),
})

export type SavedAddressInput = z.infer<typeof savedAddressSchema>
