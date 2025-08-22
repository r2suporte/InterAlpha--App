'use server';

import { revalidatePath } from "next/cache";
import { supabaseServerClient } from "../db/supabase";
import { ClientFormSchema, ClientFormValues } from "../schemas";

export async function createClient(values: ClientFormValues) {
    // 1. Validar os dados no servidor
    const validatedFields = ClientFormSchema.safeParse(values);

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return {
            error: "Campos inválidos. Por favor, verifique os dados.",
        };
    }

    // 2. Inserir os dados no Supabase
    const { data, error } = await supabaseServerClient
        .from('clients')
        .insert([validatedFields.data])
        .select()
        .single();

    if (error) {
        console.error("Supabase Error:", error.message);
        return { error: "Não foi possível cadastrar o cliente." };
    }

    // 3. Revalidar o cache para atualizar a lista de clientes
    revalidatePath('/dashboard/clients');

    return { success: "Cliente cadastrado com sucesso!", client: data };
}