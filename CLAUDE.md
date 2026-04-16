# RodeioStore — Contexto do Projeto para Claude Code

## O que é este projeto
E-commerce de Moda Country (camisas xadrez, botas, chapéus, jeans, acessórios) construído como projeto de portfólio fullstack. O objetivo é demonstrar habilidades com Next.js, Supabase, integração de pagamentos e boas práticas de código.

## Stack Tecnológica
- **Framework:** Next.js 14 com App Router e TypeScript
- **Estilização:** Tailwind CSS + shadcn/ui
- **Banco de dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Storage (imagens):** Supabase Storage
- **Estado global:** Zustand (carrinho de compras)
- **Fetch/cache:** TanStack Query (React Query)
- **Pagamentos:** Mercado Pago SDK (PIX + Cartão de crédito)
- **Emails:** Resend
- **Deploy:** Vercel

## Estrutura de Pastas
```
rodeio-store/
├── app/
│   ├── (store)/          # Rotas públicas da loja
│   ├── (auth)/           # Login e cadastro
│   ├── conta/            # Área do usuário autenticado
│   ├── admin/            # Painel administrativo
│   └── api/              # API Routes (pagamentos, webhooks)
├── components/
│   ├── ui/               # Componentes shadcn/ui (não editar manualmente)
│   ├── store/            # Componentes da loja (ProductCard, Header, etc.)
│   ├── checkout/         # Componentes do checkout
│   └── admin/            # Componentes do painel admin
├── lib/
│   ├── supabase/         # Clientes Supabase (client.ts, server.ts, middleware.ts)
│   ├── mercadopago/      # Configuração e helpers do Mercado Pago
│   └── utils.ts          # Funções utilitárias gerais
├── hooks/                # Custom React hooks
├── store/                # Zustand stores (cart.ts)
├── types/                # TypeScript types e interfaces globais
└── supabase/
    └── migrations/       # Arquivos SQL de migração do banco
```

## Convenções de Código
- Sempre usar TypeScript com tipagem explícita — evitar `any`
- Componentes de servidor por padrão; adicionar `'use client'` apenas quando necessário
- Nomes de arquivos: `kebab-case` para arquivos, `PascalCase` para componentes
- Sempre tratar erros de forma explícita (try/catch ou error boundaries)
- Usar `async/await` em vez de `.then()`
- Comentários em português para lógica de negócio complexa

## Banco de Dados — Tabelas Principais
- `profiles` — dados do usuário (FK para auth.users do Supabase)
- `categories` — categorias de produtos (slug único)
- `products` — produtos com `price`, `compare_price`, `images[]`, `is_featured`
- `product_variants` — variantes por tamanho/cor com controle de estoque
- `addresses` — endereços salvos dos usuários
- `orders` — pedidos com snapshot do endereço e status de pagamento
- `order_items` — itens do pedido com snapshot dos dados do produto

## Regras de Negócio Importantes
- Um produto pode ter múltiplas variantes (tamanho × cor)
- O estoque é controlado por variante, não por produto
- Ao criar um pedido, fazer snapshot do endereço e preço (para histórico imutável)
- Apenas usuários com `profiles.is_admin = true` acessam rotas `/admin`
- Pagamento PIX expira em 30 minutos
- Webhook do Mercado Pago atualiza `orders.payment_status` e `orders.status`

## Variáveis de Ambiente Necessárias
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
```

## Fase Atual de Desenvolvimento
Consultar `PLANO-DO-PROJETO.md` para ver o roadmap completo e as fases.

## Comandos Úteis
```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Build de produção
npm run lint         # Verifica erros de lint
npx supabase start   # Inicia Supabase local (opcional)
```
