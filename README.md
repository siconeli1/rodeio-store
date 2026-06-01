# Rodeio Store

E-commerce fullstack de moda country desenvolvido com Next.js, Supabase e Mercado Pago. O projeto simula uma loja completa, com catálogo dinâmico, carrinho persistente, checkout com PIX e cartão de crédito, área do cliente, painel administrativo e regras de segurança no banco.

## Destaques

- Catálogo com categorias, filtros, ordenação, página de produto e controle de estoque por variante.
- Carrinho persistente com Zustand e checkout validado com React Hook Form + Zod.
- Pagamentos via Mercado Pago, incluindo PIX, cartão, webhook assinado e histórico de eventos.
- Autenticação com Supabase Auth, recuperação de senha e rotas privadas.
- Painel administrativo para produtos, categorias, pedidos, imagens e métricas.
- Banco PostgreSQL com migrations, RLS e funções RPC para operações críticas.
- SEO com metadata dinâmica, Open Graph, sitemap e robots.
- Testes automatizados para regras de checkout, webhook e status de pagamento.

## Stack

- Next.js 16, React 19 e TypeScript
- Tailwind CSS 4 e shadcn/ui
- Supabase: PostgreSQL, Auth, Storage e Row Level Security
- Mercado Pago SDK
- Zustand, TanStack Query, React Hook Form e Zod
- Vitest, ESLint e Vercel

## Funcionalidades

### Loja

- Home com produtos em destaque e categorias.
- Listagem de produtos com filtros por categoria e tamanho.
- Página de produto com galeria, cores, tamanhos e disponibilidade.
- Carrinho lateral persistente.

### Checkout

- Formulário de endereço com validação e busca por CEP.
- Cálculo de subtotal, frete e total.
- Pagamento por PIX com QR Code e código copia-e-cola.
- Pagamento por cartão com parcelamento.
- Snapshot do pedido para preservar itens e endereço no momento da compra.

### Conta do cliente

- Cadastro, login, confirmação de email e redefinição de senha.
- Dashboard com resumo de pedidos.
- Histórico e detalhe de pedidos.
- Cadastro e edição de endereços.
- Edição de perfil.

### Admin

- Acesso restrito por perfil administrativo.
- Dashboard com métricas de vendas e estoque.
- CRUD de produtos, variantes e categorias.
- Upload de imagens para o Supabase Storage.
- Atualização de status dos pedidos.

## Rodando localmente

### Pré-requisitos

- Node.js 20+
- Projeto Supabase
- Conta de desenvolvedor no Mercado Pago
- Conta Resend, opcional para emails transacionais

### Instalação

```bash
git clone https://github.com/siconeli1/rodeio-store.git
cd rodeio-store
npm install
cp .env.example .env.local
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

### Banco de dados

Execute as migrations em `supabase/migrations/` no seu projeto Supabase. Elas criam as tabelas principais, policies de RLS, buckets de imagens e funções auxiliares usadas pelo checkout.

## Variáveis de ambiente

Use o arquivo [.env.example](./.env.example) como base para criar seu `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHIPPING_COST=15

RESEND_API_KEY=
CRON_SECRET=
```

Nunca publique valores reais de `.env.local`. Chaves de servidor, como `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `RESEND_API_KEY` e `CRON_SECRET`, devem existir apenas em ambiente local ou no painel da Vercel.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## Estrutura

```text
app/                 Rotas, layouts, Server Actions e API Routes
components/          Componentes de UI, loja, checkout e admin
lib/                 Clientes, schemas, helpers e integrações externas
store/               Estado global do carrinho
supabase/migrations/ Migrations SQL do banco
tests/               Testes automatizados
types/               Tipos compartilhados
```

## Webhooks e cron

O webhook do Mercado Pago deve apontar para:

```text
https://<seu-dominio>/api/webhooks/mercadopago
```

O projeto também inclui uma rota opcional `GET /api/crons/keep-alive`, protegida por `CRON_SECRET` quando a variável estiver configurada.

## Deploy

1. Crie um projeto na Vercel a partir do repositório.
2. Configure as variáveis de ambiente no painel da Vercel.
3. Rode as migrations no Supabase.
4. Configure o webhook no Mercado Pago.
5. Publique a branch principal.

## Licença

MIT
