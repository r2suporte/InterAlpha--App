import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function ClientsPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Clientes</h1>
                <Button asChild>
                    <Link href="/dashboard/clients/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Cliente
                    </Link>
                </Button>
            </div>
            {/* A tabela de clientes será adicionada aqui em uma próxima etapa */}
            <p className="text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
        </div>
    );
}