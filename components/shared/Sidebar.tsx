import Link from "next/link";
import { LayoutDashboard, Users, Wrench, DollarSign } from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/clients", label: "Clientes", icon: Users },
    { href: "/dashboard/orders", label: "Ordens de Serviço", icon: Wrench },
    { href: "/dashboard/finance", label: "Financeiro", icon: DollarSign },
];

const Sidebar = () => {
    return (
        <nav className="flex flex-col gap-2 p-4">
            <Link href="/dashboard" className="mb-4 flex items-center gap-2">
                {/* Você pode adicionar um logo aqui */}
                <h1 className="text-2xl font-bold">InterAlpha</h1>
            </Link>
            {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
};

export default Sidebar;