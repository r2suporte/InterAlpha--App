import { ClientForm } from "@/components/forms/ClientForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function NewClientPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Cadastrar Novo Cliente</CardTitle>
                <CardDescription>
                    Preencha os dados abaixo para adicionar um novo cliente ao sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ClientForm />
            </CardContent>
        </Card>
    );
}