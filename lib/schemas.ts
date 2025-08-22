import { z } from "zod";

// Funções de validação simples. Para produção, use bibliotecas robustas.
const isCpf = (cpf: string) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
const isCnpj = (cnpj: string) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);

export const ClientFormSchema = z.object({
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
    phone: z.string().optional(),
    client_type: z.enum(["INDIVIDUAL", "COMPANY"], {
        required_error: "O tipo de cliente é obrigatório.",
    }),
    document: z.string().min(1, { message: "O documento é obrigatório." }),
    address_cep: z.string().min(9, { message: "O CEP deve ter 8 dígitos." }),
    address_street: z.string().min(1, { message: "A rua é obrigatória." }),
    address_number: z.string().min(1, { message: "O número é obrigatório." }),
    address_complement: z.string().optional(),
    address_city: z.string().min(1, { message: "A cidade é obrigatória." }),
    address_state: z.string().min(1, { message: "O estado é obrigatório." }),
}).refine(data => {
    if (data.client_type === 'INDIVIDUAL') {
        return isCpf(data.document);
    }
    if (data.client_type === 'COMPANY') {
        return isCnpj(data.document);
    }
    return false;
}, { message: "O formato do documento é inválido.", path: ["document"] });

export type ClientFormValues = z.infer<typeof ClientFormSchema>;