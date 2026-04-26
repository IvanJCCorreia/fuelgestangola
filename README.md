# ⛽ FuelgestAngola — Sistema SaaS de Gestão de Postos de Combustível

> Plataforma profissional multi-tenant para gestão completa de postos de abastecimento de combustível em Angola.

---

## 📋 Índice
- [Funcionalidades](#funcionalidades)
- [Arquitectura](#arquitectura)
- [Configuração Firebase](#configuração-firebase)
- [Instalação e Deploy](#instalação-e-deploy)
- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
- [Perfis de Utilizador](#perfis-de-utilizador)
- [Segurança](#segurança)

---

## ✅ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🔐 Autenticação | Login, logout, reset de senha via Firebase Auth |
| 🏢 Empresas | Gestão multi-empresa com dados isolados |
| ⛽ Postos | Criação e gestão de múltiplos postos por empresa |
| 🛢 Tanques | Controlo de capacidade e volume por produto |
| ⚙ Bombas | Associação de bombas a tanques |
| 💳 Vendas | Registo com cálculo automático e histórico |
| 📦 Recepção | Entrada de combustível com actualização automática |
| 📊 Estoque | Entradas, saídas e saldo em tempo real |
| ⚖ Diferenças | Comparação físico vs teórico |
| 📋 Relatórios | Vendas diárias, mensais, estoque |
| ⊞ Dashboard | Visão geral com alertas críticos |
| 👥 Utilizadores | Gestão com perfis admin/gestor/operador |
| 📜 Auditoria | Log de todas as acções do sistema |

---

## 🏗 Arquitectura

```
FuelgestAngola (SaaS)
├── Frontend: HTML + CSS + JavaScript + React (CDN)
├── Backend: Firebase
│   ├── Authentication: Firebase Auth
│   ├── Database: Cloud Firestore (multi-tenant)
│   └── Hosting: Firebase Hosting
└── Segurança: Firestore Security Rules (isolamento por empresa)
```

### Isolamento Multi-Tenant

Cada empresa tem os seus dados **completamente isolados** no Firestore:
- Regras de segurança verificam `companyId` do utilizador
- Utilizadores só acedem aos dados da sua empresa
- Admins têm acesso cross-company para gestão global

---

## 🔥 Configuração Firebase

### 1. Criar projecto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projecto"**
3. Nome: `fuelgest-angola` (ou o nome da sua preferência)
4. Active o Google Analytics (opcional)

### 2. Activar serviços

#### Authentication
```
Firebase Console → Authentication → Sign-in method
→ Activar "Email/senha"
```

#### Firestore Database
```
Firebase Console → Firestore Database → Criar base de dados
→ Seleccionar "Modo de produção"
→ Escolher região: eur3 (Europe) ou nam5 (US)
```

#### Firebase Hosting
```
Firebase Console → Hosting → Começar
```

### 3. Obter credenciais

```
Firebase Console → Configurações do projecto → Apps
→ Adicionar app Web (</>)
→ Registar app
→ Copiar firebaseConfig
```

### 4. Configurar no index.html

Abra `index.html` e substitua o bloco `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECTO.firebaseapp.com",
  projectId: "SEU_PROJECTO_ID",
  storageBucket: "SEU_PROJECTO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

---

## 🚀 Instalação e Deploy

### Pré-requisitos
- Node.js 16+
- Firebase CLI

### Instalação Firebase CLI

```bash
npm install -g firebase-tools
```

### Login e inicialização

```bash
# Login
firebase login

# Inicializar no directório do projecto
cd fuelgest-angola
firebase init

# Seleccionar: Firestore + Hosting
# Usar ficheiro firebase.json existente
```

### Deploy das regras Firestore

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Deploy do site

```bash
firebase deploy --only hosting
```

### Deploy completo

```bash
firebase deploy
```

### Criar primeiro utilizador admin

Após o deploy, acesse o site e crie uma conta. Depois no Firebase Console:

```
Firestore → Colecção "users" → documento do seu UID
→ Adicionar campo: role = "admin"
→ Adicionar campo: companyId = ""
```

---

## 🗄 Estrutura do Banco de Dados

```
Firestore
│
├── users/
│   └── {uid}/
│       ├── name: string
│       ├── email: string
│       ├── role: "admin" | "manager" | "operator"
│       └── companyId: string
│
└── companies/
    └── {companyId}/
        ├── name: string
        ├── nif: string
        ├── email: string
        ├── phone: string
        ├── address: string
        ├── active: boolean
        ├── createdAt: timestamp
        │
        ├── stations/
        │   └── {stationId}/
        │       ├── name: string
        │       ├── location: string
        │       ├── municipality: string
        │       ├── province: string
        │       ├── contact: string
        │       │
        │       ├── tanks/
        │       │   └── {tankId}/
        │       │       ├── product: string
        │       │       ├── capacity: number (litros)
        │       │       └── volume: number (litros actual)
        │       │
        │       ├── pumps/
        │       │   └── {pumpId}/
        │       │       ├── number: string
        │       │       └── tankId: string (ref)
        │       │
        │       ├── sales/
        │       │   └── {saleId}/
        │       │       ├── pumpId: string (ref)
        │       │       ├── liters: number
        │       │       ├── pricePerLiter: number
        │       │       ├── total: number
        │       │       ├── paymentMethod: string
        │       │       └── date: timestamp
        │       │
        │       ├── fuelReceipts/
        │       │   └── {receiptId}/
        │       │       ├── product: string
        │       │       ├── quantity: number
        │       │       ├── guideNumber: string
        │       │       ├── supplier: string
        │       │       ├── tankId: string (ref)
        │       │       └── date: timestamp
        │       │
        │       └── stock/
        │           └── {stockId}/
        │               ├── type: "entry" | "exit"
        │               ├── product: string
        │               ├── quantity: number
        │               ├── reference: string
        │               └── date: timestamp
        │
        └── audit/
            └── {logId}/
                ├── userId: string
                ├── action: string
                ├── details: object
                └── timestamp: timestamp
```

---

## 👤 Perfis de Utilizador

| Perfil | Acesso |
|--------|--------|
| **Admin** | Acesso total: gestão de empresas, utilizadores, todas as operações |
| **Manager** | Gestão de postos, tanques, bombas, relatórios, vendas |
| **Operator** | Registo de vendas e recepções apenas |

---

## 🔒 Segurança

### Regras Firestore
- Utilizadores só acedem à sua empresa (`companyId`)
- Admins têm acesso global para suporte
- Logs de auditoria são imutáveis (apenas create)
- Validação de roles em cada operação

### Boas práticas implementadas
- ✅ Isolamento total de dados por empresa
- ✅ Autenticação obrigatória em todos os endpoints
- ✅ Logs de auditoria para rastreabilidade
- ✅ Verificação de role em cada operação CRUD
- ✅ Headers de segurança HTTP no Hosting

### Backup automático
Activar via Firebase Console:
```
Firestore → Import/Export → Agendar exportação
→ Destino: Cloud Storage bucket
→ Frequência: Diária
```

---

## 🇦🇴 Localização Angola

- Moeda: **AOA (Kwanza Angolano)**
- Formato de data: **DD/MM/YYYY**
- Idioma: **Português (Angola)**
- Produtos padrão: Gasolina 91, Gasolina 95, Gasóleo, Jet A1
- Provincias: 18 provincias de Angola incluídas

---

## 📞 Suporte

Para questões técnicas ou comerciais, contacte o administrador do sistema.

---

*FuelgestAngola v2.0 — Desenvolvido para conformidade com regulamentos ANPG Angola*
