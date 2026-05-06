# RodeioStore

E-commerce de **Moda Country** construído como projeto de portfólio fullstack — camisas xadrez, botas texanas, chapéus, jeans e acessórios para quem curte o estilo do campo.

A proposta foi montar uma loja completa e real: catálogo dinâmico, carrinho persistente, checkout com pagamento via PIX e cartão de crédito (Mercado Pago), área do usuário, painel administrativo e deploy automatizado — tudo em um único repositório Next.js.

---

## Stack Tecnológica

### Frontend
- **Next.js 16** (App Router, Server Components, Server Actions)
- **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (componentes acessíveis)
- **Zustand** — estado global do carrinho (com persistência em `localStorage`)
- **TanStack Query** — cache e fetching no client
- **React Hook Form** + **Zod** — formulários e validação
- **Sonner** — notificações toast
- **Lucide React** — ícones

### Backend / Infra
- **Supabase** — PostgreSQL, Auth, Storage e RLS
- **Mercado Pago SDK** — PIX (QR Code + copia-e-cola) e Cartão de Crédito
- **Resend** — emails transacionais
- **Vercel** — hospedagem, Edge Functions e Cron Jobs

---

## Features implementadas

### Loja
- Home com hero, produtos em destaque e grade de categorias
- Catálogo com filtros por categoria e tamanho, ordenação por preço ou novidade
- Detalhe do produto com galeria de imagens, seletor de cor/tamanho e controle de estoque por variante
- Página de categoria com breadcrumb
- Badge de desconto quando há `compare_price`

### Carrinho e Checkout
- Drawer lateral persistente (localStorage)
- Cálculo automático de subtotal e frete
- Formulário de endereço com busca por CEP (ViaCEP)
- Pagamento PIX com QR Code, código copia-e-cola e polling de confirmação
- Pagamento com Cartão de Crédito com parcelamento em até 12x
- Snapshot imutável do endereço e dos itens no pedido
- Webhook do Mercado Pago atualizando status do pagamento em tempo real

### Autenticação
- Cadastro, login, recuperação de senha e redefinição (Supabase Auth)
- Middleware protegendo rotas privadas
- Confirmação de email via link

### Área do Usuário (`/conta`)
- Dashboard com resumo dos últimos pedidos
- Histórico de pedidos com detalhe e status de pagamento
- Gerenciamento de endereços salvos (criar, editar, definir padrão, excluir)
- Edição de perfil (nome, telefone)

### Painel Admin (`/admin`)
- Acesso restrito via `profiles.is_admin = true`
- Dashboard com métricas (vendas, pedidos do dia, produtos sem estoque)
- CRUD completo de produtos, variantes e categorias
- Upload de múltiplas imagens (Supabase Storage)
- Gestão de pedidos com atualização de status

### UX e Qualidade
- Loading skeletons e Suspense boundaries
- Error boundaries por rota (`/`, `/conta`, `/checkout`, `/admin`)
- `generateMetadata` dinâmico nas páginas públicas
- Open Graph para compartilhamento social
- `sitemap.xml` e `robots.txt` dinâmicos
- SEO pt-BR com título templateado
- Responsivo mobile / tablet / desktop

---

## Começando localmente

### Pré-requisitos
- Node.js 20+
- Conta no [Supabase](https://supabase.com/) (free tier suficiente)
- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers/) (sandbox)
- Conta no [Resend](https://resend.com/) (opcional, para emails)

### Instalação

```bash
git clone https://github.com/<seu-usuario>/rodeio-store.git
cd rodeio-store
npm install
```

Crie o arquivo `.env.local` baseado nas variáveis abaixo e depois:

```bash
npm run dev
```

A aplicação sobe em `http://localhost:3000`.

### Banco de dados

Rode as migrations do diretório `supabase/migrations/` no seu projeto Supabase. As tabelas principais são: `profiles`, `categories`, `products`, `product_variants`, `addresses`, `orders`, `order_items`.

---

## Variáveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHIPPING_COST=15

# Resend (emails transacionais — opcional)
RESEND_API_KEY=

# Cron (opcional — protege /api/crons/keep-alive)
CRON_SECRET=
```

---

## Estrutura de pastas

```
rodeio-store/
├── app/
│   ├── (store)/          # Rotas públicas da loja (home, produtos, categorias)
│   ├── (auth)/           # Login, cadastro, recuperação de senha
│   ├── conta/            # Área autenticada (pedidos, endereços, perfil)
│   ├── admin/            # Painel administrativo
│   ├── checkout/         # Fluxo de compra (endereço, pagamento, confirmação)
│   ├── api/              # API Routes (checkout, webhooks, crons)
│   ├── sitemap.ts        # Sitemap dinâmico
│   └── robots.ts         # robots.txt
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   ├── store/            # Header, ProductCard, CartSheet, etc.
│   ├── checkout/         # Formulários e resumo do checkout
│   └── admin/            # Componentes do painel
├── lib/
│   ├── supabase/         # Clients (browser, server, middleware)
│   ├── mercadopago/      # Configuração e helpers de pagamento
│   └── utils.ts
├── hooks/                # Custom hooks
├── store/                # Zustand stores
├── types/                # Tipagem global
└── supabase/
    └── migrations/       # SQL migrations
```

---

## Scripts

```bash
npm run dev     # Servidor de desenvolvimento
npm run build   # Build de produção
npm run start   # Servir o build
npm run lint    # Lint
```

---

## Cron Jobs

O projeto inclui um cron job configurado via Vercel para manter o banco Supabase (free tier) ativo. O free tier pausa projetos inativos após 7 dias.

- **Rota:** `GET /api/crons/keep-alive`
- **Frequência:** a cada 6 dias (`0 0 */6 * *`)
- **O que faz:** executa uma query simples para registrar atividade
- **Autenticação:** se `CRON_SECRET` estiver definido, exige `Authorization: Bearer <CRON_SECRET>`

---

## Deploy na Vercel

1. Faça fork/push do repositório no GitHub
2. Importe o projeto em [vercel.com/new](https://vercel.com/new)
3. Configure todas as variáveis de ambiente no painel da Vercel
4. O deploy acontece automaticamente a cada push na branch `main`

O webhook do Mercado Pago deve apontar para `https://<seu-dominio>.vercel.app/api/webhooks/mercadopago` e usar a chave secreta configurada em `MERCADOPAGO_WEBHOOK_SECRET`.

---

## Roadmap

O plano de desenvolvimento foi organizado em 8 fases e está detalhado em [`PLANO-DO-PROJETO.md`](./PLANO-DO-PROJETO.md).

---

## Licença

MIT — use como quiser, é um projeto de portfólio.
