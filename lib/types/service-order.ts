export interface ServicePart {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

export interface ServiceOrderData {
    deviceType: string;
    deviceModel: string;
    serialNumber: string;
    reportedDefect: string;
    damages: string;
    defectDescription: string;
    solution: string;
    parts: ServicePart[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    serviceType: string;
    priority: string;
    preferredDate: string;
    observations: string;
}

export interface Cliente {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    endereco: string;
    numero_cliente: string;
    created_at: string;
}

export interface OrdemServicoCriada {
    id: string;
    numero_os: string;
    created_at: string;
}
