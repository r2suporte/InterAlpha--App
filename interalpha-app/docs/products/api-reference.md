# 🔧 API Reference - Sistema de Produtos

## 📋 Visão Geral

Esta documentação descreve todas as APIs REST disponíveis para o Sistema de Gestão de Produtos.

**Base URL**: `https://app.interalpha.com/api`  
**Versão**: v1  
**Autenticação**: Bearer Token (JWT)

## 🔐 Autenticação

Todas as APIs requerem autenticação via JWT token:

```http
Authorization: Bearer <jwt_token>
```

### **Obter Token**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@interalpha.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "João Silva",
    "email": "user@interalpha.com"
  }
}
```

---

## 📦 **PRODUTOS**

### **Listar Produtos**
```http
GET /api/produtos
```

**Parâmetros de Query:**
| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `page` | number | Página (padrão: 1) | `?page=2` |
| `limit` | number | Itens por página (padrão: 20) | `?limit=50` |
| `search` | string | Busca por nome/código | `?search=PROD001` |
| `categoryId` | string | Filtrar por categoria | `?categoryId=cat_123` |
| `isActive` | boolean | Filtrar por status | `?isActive=true` |
| `lowStock` | boolean | Apenas estoque baixo | `?lowStock=true` |
| `sortBy` | string | Campo para ordenação | `?sortBy=partNumber` |
| `sortOrder` | string | Ordem (asc/desc) | `?sortOrder=desc` |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "partNumber": "PROD001",
      "description": "Produto de exemplo",
      "costPrice": 50.00,
      "salePrice": 75.00,
      "quantity": 100,
      "minStock": 10,
      "stockUnit": "UN",
      "imageUrl": "https://...",
      "isActive": true,
      "categoryId": "cat_123",
      "category": {
        "id": "cat_123",
        "name": "Eletrônicos",
        "color": "#3B82F6"
      },
      "margin": 50.0,
      "stockStatus": "IN_STOCK",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "stats": {
    "totalValue": 15000.00,
    "averagePrice": 45.50,
    "lowStockCount": 5
  }
}
```

### **Obter Produto por ID**
```http
GET /api/produtos/{id}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "partNumber": "PROD001",
    "description": "Produto de exemplo",
    "costPrice": 50.00,
    "salePrice": 75.00,
    "quantity": 100,
    "minStock": 10,
    "maxStock": 500,
    "stockUnit": "UN",
    "imageUrl": "https://...",
    "isActive": true,
    "categoryId": "cat_123",
    "category": {
      "id": "cat_123",
      "name": "Eletrônicos"
    },
    "creator": {
      "id": "user_123",
      "name": "João Silva"
    },
    "orderItems": [
      {
        "id": "item_123",
        "quantity": 2,
        "totalPrice": 150.00,
        "createdAt": "2024-01-15T10:30:00Z",
        "order": {
          "id": "order_123",
          "titulo": "Ordem de Teste"
        }
      }
    ],
    "stockMovements": [
      {
        "id": "mov_123",
        "type": "IN",
        "quantity": 50,
        "reason": "Compra",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "stats": {
      "totalSold": 25,
      "totalRevenue": 1875.00,
      "margin": 50.0,
      "averageOrderQuantity": 2.5
    }
  }
}
```

### **Criar Produto**
```http
POST /api/produtos
Content-Type: application/json

{
  "partNumber": "PROD002",
  "description": "Novo produto",
  "costPrice": 30.00,
  "salePrice": 45.00,
  "quantity": 50,
  "minStock": 5,
  "maxStock": 200,
  "stockUnit": "UN",
  "categoryId": "cat_123",
  "imageUrl": "https://..."
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "prod_124",
    "partNumber": "PROD002",
    "description": "Novo produto",
    "costPrice": 30.00,
    "salePrice": 45.00,
    "quantity": 50,
    "minStock": 5,
    "maxStock": 200,
    "stockUnit": "UN",
    "imageUrl": "https://...",
    "isActive": true,
    "categoryId": "cat_123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Produto criado com sucesso"
}
```

### **Atualizar Produto**
```http
PUT /api/produtos/{id}
Content-Type: application/json

{
  "description": "Descrição atualizada",
  "salePrice": 50.00,
  "quantity": 75
}
```

### **Excluir Produto**
```http
DELETE /api/produtos/{id}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Produto excluído com sucesso"
}
```

### **Buscar Produtos**
```http
GET /api/produtos/search?q={query}&limit={limit}
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "partNumber": "PROD001",
      "description": "Produto encontrado",
      "salePrice": 75.00,
      "quantity": 100,
      "imageUrl": "https://...",
      "rank": 0.95
    }
  ]
}
```

### **Verificar Part Number**
```http
GET /api/produtos/check-part-number?partNumber={partNumber}
```

**Resposta:**
```json
{
  "available": false,
  "message": "Part Number já existe",
  "existingProduct": {
    "id": "prod_123",
    "partNumber": "PROD001"
  }
}
```

### **Estatísticas de Produtos**
```http
GET /api/produtos/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "activeProducts": 145,
    "totalCategories": 12,
    "lowStockProducts": 8,
    "outOfStockProducts": 2,
    "totalStockValue": 45000.00,
    "averageMargin": 42.5,
    "averagePrice": 67.80
  }
}
```

---

## 📂 **CATEGORIAS**

### **Listar Categorias**
```http
GET /api/categorias
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_123",
      "name": "Eletrônicos",
      "description": "Produtos eletrônicos",
      "color": "#3B82F6",
      "icon": "🔌",
      "isActive": true,
      "productCount": 25,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### **Criar Categoria**
```http
POST /api/categorias
Content-Type: application/json

{
  "name": "Nova Categoria",
  "description": "Descrição da categoria",
  "color": "#10B981",
  "icon": "📱"
}
```

### **Atualizar Categoria**
```http
PUT /api/categorias/{id}
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "color": "#EF4444"
}
```

### **Excluir Categoria**
```http
DELETE /api/categorias/{id}
```

---

## 📊 **ESTOQUE**

### **Movimentações de Estoque**
```http
GET /api/estoque/movimentacoes?productId={id}&limit={limit}
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mov_123",
      "productId": "prod_123",
      "type": "IN",
      "quantity": 50,
      "reason": "Compra de mercadoria",
      "reference": "NF_001",
      "userId": "user_123",
      "user": {
        "name": "João Silva"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### **Registrar Movimentação**
```http
POST /api/estoque/movimentacoes
Content-Type: application/json

{
  "productId": "prod_123",
  "type": "IN",
  "quantity": 25,
  "reason": "Entrada de estoque",
  "reference": "NF_002"
}
```

### **Relatório de Estoque**
```http
GET /api/estoque/relatorio?lowStock=true&categoryId={id}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "partNumber": "PROD001",
        "description": "Produto com estoque baixo",
        "quantity": 3,
        "minStock": 10,
        "stockUnit": "UN",
        "costPrice": 50.00,
        "totalValue": 150.00
      }
    ],
    "stats": {
      "totalProducts": 150,
      "lowStockProducts": 8,
      "outOfStockProducts": 2,
      "totalStockValue": 45000.00,
      "averageStockLevel": 67.5
    }
  }
}
```

### **Alertas de Estoque**
```http
GET /api/estoque/alertas
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "prod_123",
      "product": {
        "partNumber": "PROD001",
        "description": "Produto crítico",
        "quantity": 0,
        "minStock": 10
      },
      "alertType": "OUT_OF_STOCK",
      "severity": "CRITICAL"
    }
  ]
}
```

---

## 🛒 **ORDENS DE SERVIÇO**

### **Listar Ordens**
```http
GET /api/ordens-servico?page={page}&status={status}&clienteId={id}
```

### **Criar Ordem com Produtos**
```http
POST /api/ordens-servico
Content-Type: application/json

{
  "titulo": "Ordem de Teste",
  "descricao": "Descrição da ordem",
  "clienteId": "client_123",
  "valor": 200.00,
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "unitPrice": 75.00,
      "description": "Produto para a ordem"
    }
  ]
}
```

### **Gerenciar Itens da Ordem**
```http
GET /api/ordens-servico/{id}/items
POST /api/ordens-servico/{id}/items
PUT /api/ordens-servico/{id}/items
```

---

## 📈 **DASHBOARD**

### **Métricas do Dashboard**
```http
GET /api/dashboard/metricas?period={days}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProducts": 150,
      "activeProducts": 145,
      "lowStockProducts": 8,
      "totalStockValue": 45000.00,
      "averageMargin": 42.5
    },
    "topProducts": {
      "mostSold": [
        {
          "id": "prod_123",
          "partNumber": "PROD001",
          "totalSold": 50,
          "revenue": 3750.00
        }
      ],
      "highestMargin": [
        {
          "id": "prod_124",
          "partNumber": "PROD002",
          "margin": 75.0,
          "marginPercent": 150.0
        }
      ]
    },
    "categoryStats": [
      {
        "id": "cat_123",
        "name": "Eletrônicos",
        "productCount": 25,
        "totalValue": 12500.00,
        "averagePrice": 85.50
      }
    ],
    "stockAlerts": [
      {
        "id": "prod_125",
        "partNumber": "PROD003",
        "currentStock": 2,
        "minStock": 10,
        "alertType": "LOW_STOCK"
      }
    ]
  }
}
```

### **Performance por Período**
```http
GET /api/dashboard/performance?days={days}
```

---

## 📁 **IMPORTAÇÃO/EXPORTAÇÃO**

### **Exportar Produtos**
```http
POST /api/produtos/export
Content-Type: application/json

{
  "format": "csv",
  "includeStock": true,
  "includeCategories": true,
  "categoryId": "cat_123",
  "fields": ["partNumber", "description", "salePrice"]
}
```

**Resposta:** Arquivo CSV/Excel para download

### **Validar Importação**
```http
POST /api/produtos/import/validate
Content-Type: multipart/form-data

file: [arquivo.csv]
```

**Resposta:**
```json
{
  "valid": true,
  "errors": [],
  "preview": [
    {
      "partNumber": "PROD001",
      "description": "Produto 1",
      "costPrice": 50.00,
      "salePrice": 75.00
    }
  ],
  "totalRows": 100
}
```

### **Importar Produtos**
```http
POST /api/produtos/import
Content-Type: multipart/form-data

file: [arquivo.csv]
updateExisting: true
createCategories: true
```

**Resposta:**
```json
{
  "success": true,
  "totalRows": 100,
  "successCount": 95,
  "errorCount": 5,
  "errors": [
    {
      "row": 15,
      "field": "partNumber",
      "message": "Part Number já existe",
      "data": {...}
    }
  ],
  "createdProducts": ["prod_126", "prod_127"],
  "updatedProducts": ["prod_123", "prod_124"]
}
```

---

## 📊 **MONITORAMENTO**

### **Health Check**
```http
GET /api/health
```

**Resposta:**
```json
{
  "status": "healthy",
  "uptime": 86400000,
  "memory": {
    "used": 134217728,
    "total": 268435456,
    "percentage": 50.0
  },
  "database": {
    "connected": true,
    "responseTime": 15,
    "activeConnections": 5
  },
  "cache": {
    "connected": true,
    "hitRate": 85.5,
    "memoryUsage": "45MB"
  }
}
```

### **Métricas de Performance**
```http
GET /api/monitoring/performance?endpoint={endpoint}&hours={hours}
```

### **Estatísticas de Cache**
```http
GET /api/monitoring/cache/stats
```

---

## ❌ **Códigos de Erro**

| Código | Descrição | Exemplo |
|--------|-----------|---------|
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token inválido |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Part Number duplicado |
| 422 | Unprocessable Entity | Validação falhou |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro interno |

### **Formato de Erro**
```json
{
  "error": "Mensagem de erro",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "partNumber",
    "message": "Part Number é obrigatório"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔄 **Rate Limiting**

- **Limite**: 1000 requests/hora por usuário
- **Headers de Resposta**:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp do reset

---

## 📝 **Versionamento**

- **Versão Atual**: v1
- **Header**: `API-Version: v1`
- **Backward Compatibility**: Mantida por 12 meses

---

## 🔧 **SDKs e Bibliotecas**

### **JavaScript/TypeScript**
```bash
npm install @interalpha/products-sdk
```

```typescript
import { ProductsAPI } from '@interalpha/products-sdk'

const api = new ProductsAPI({
  baseURL: 'https://app.interalpha.com/api',
  token: 'your-jwt-token'
})

const products = await api.products.list({ page: 1, limit: 20 })
```

### **Python**
```bash
pip install interalpha-products
```

```python
from interalpha_products import ProductsClient

client = ProductsClient(
    base_url='https://app.interalpha.com/api',
    token='your-jwt-token'
)

products = client.products.list(page=1, limit=20)
```

---

**Última Atualização**: $(date)  
**Versão da API**: v1.0.0