'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientFormSchema, ClientFormValues } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import InputMask from "react-input-mask";
import { createClient } from "@/lib/actions/client.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

async function fetchCepData(cep: string) {
    const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.erro ? null : data;
}

export function ClientForm() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(ClientFormSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            client_type: "INDIVIDUAL",
            document: "",
            address_cep: "",
            address_street: "",
            address_number: "",
            address_complement: "",
            address_city: "",
            address_state: "",
        },
    });

    const clientType = form.watch("client_type");

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value;
        if (cep.length >= 8) {
            const data = await fetchCepData(cep);
            if (data) {
                form.setValue("address_street", data.logradouro);
                form.setValue("address_city", data.localidade);
                form.setValue("address_state", data.uf);
            }
        }
    };

    const onSubmit = (values: ClientFormValues) => {
        startTransition(async () => {
            const result = await createClient(values);
            if (result.error) {
                toast.error("Erro ao cadastrar", { description: result.error });
            } else {
                toast.success("Cliente cadastrado!", { description: "O cliente foi adicionado com sucesso." });
                router.push("/dashboard/clients");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="Ex: joao.silva@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="client_type" render={({ field }) => (
                        <FormItem><FormLabel>Tipo de Cliente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="INDIVIDUAL">Pessoa Física</SelectItem>
                                    <SelectItem value="COMPANY">Pessoa Jurídica</SelectItem>
                                </SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="document" render={({ field }) => (
                        <FormItem><FormLabel>{clientType === 'INDIVIDUAL' ? 'CPF' : 'CNPJ'}</FormLabel><FormControl>
                            <InputMask mask={clientType === 'INDIVIDUAL' ? '999.999.999-99' : '99.999.999/9999-99'} {...field}>
                                {(inputProps: any) => <Input {...inputProps} />}
                            </InputMask>
                        </FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl>
                            <InputMask mask="(99) 99999-9999" {...field}>
                                {(inputProps: any) => <Input {...inputProps} />}
                            </InputMask>
                        </FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <h3 className="text-lg font-medium border-t pt-6">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="address_cep" render={({ field }) => (
                        <FormItem><FormLabel>CEP</FormLabel><FormControl>
                            <InputMask mask="99999-999" {...field} onBlur={handleCepBlur}>
                                {(inputProps: any) => <Input {...inputProps} />}
                            </InputMask>
                        </FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address_street" render={({ field }) => (
                        <FormItem className="md:col-span-3"><FormLabel>Rua / Logradouro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="address_number" render={({ field }) => (
                        <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address_complement" render={({ field }) => (
                        <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Ex: Apto 101" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address_city" render={({ field }) => (
                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address_state" render={({ field }) => (
                        <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Salvando..." : "Salvar Cliente"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}