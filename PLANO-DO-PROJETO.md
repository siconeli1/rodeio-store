# 🤠 Plano do Projeto — Loja de Moda Country

> E-commerce completo para portfólio, com sistema de pagamento integrado (PIX + Cartão), catálogo dinâmico, painel administrativo e deploy gratuito na Vercel.

---

## 🎯 Visão Geral do Projeto

**Nome sugerido:** RodeioStore (ou personalizável)  
**Nicho:** Moda Country — camisas xadrez, botas, chapéus, jeans, acessórios  
**Objetivo:** Portfólio GitHub com projeto fullstack real e funcional  
**Custo de produção:** R$ 0 (usando tiers gratuitos)  
**Deploy:** Vercel (frontend + API) + Supabase (banco de dados)

---

## 🛠️ Stack Tecnológica

### Frontend + Backend (Fullstack)
| Tecnologia | Função | Por quê |
|---|---|---|
| **Next.js 14** (App Router) | Framework principal | Fullstack em um projeto só, SSR/SSG para SEO, padrão do mercado |
| **TypeScript** | Tipagem | Código profissional, evita bugs, muito valorizado em portfólio |
| **Tailwind CSS** | Estilização | Produtividade alta, responsivo por padrão |
| **shadcn/ui** | Componentes UI | Componentes prontos e acessíveis, visual profissional |

### Banco de Dados & Auth
| Tecnologia | Função | Por quê |
|---|---|---|
| **Supabase** | PostgreSQL + Auth + Storage | Tudo em um, free tier generoso, integra perfeitamente com Next.js |

### Estado e Dados
| Tecnologia | Função | Por quê |
|---|---|---|
| **Zustand** | Estado do carrinho | Simples, leve, sem boilerplate |
| **React Query (TanStack)** | Fetch e cache de dados | Padrão do mercado para dados assíncronos |

### Pagamentos
| Tecnologia | Função | Por quê |
|---|---|---|
| **Mercado Pago SDK** | PIX + Cartão de crédito | Maior processador do Brasil, sandbox gratuito, API bem documentada |

### Email
| Tecnologia | Função | Por quê |
|---|---|---|
| **Resend** | Emails transacionais | Free tier (3.000 emails/mês), API simples, integra com React Email |

### Deploy
| Tecnologia | Função | Por quê |
|---|---|---|
| **Vercel** | Hospedagem | Integração nativa com Next.js, deploy automático via GitHub, free tier |

---

## 🗄️ Schema do Banco de Dados

### Tabela: `profiles`
```sql
id          uuid (FK → auth.users)
full_name   text
phone       text
is_admin    boolean (default: false)
created_at  timestamp
```

### Tabela: `categories`
```sql
id          uuid
name        text
slug        text (unique)
description text
image_url   text
created_at  timestamp
```

### Tabela: `products`
```sql
id              uuid
name            text
slug            text (unique)
description     text
price           numeric
compare_price   numeric (preço riscado, para promoções)
category_id     uuid (FK → categories)
images          text[] (array de URLs)
is_active       boolean
is_featured     boolean
created_at      timestamp
```

### Tabela: `product_variants`
```sql
id          uuid
product_id  uuid (FK → products)
size        text (PP, P, M, G, GG, XG)
color       text (ex: "Azul Royal")
color_hex   text (ex: "#1E40AF")
stock       integer
sku         text (único por variante)
```

### Tabela: `addresses`
```sql
id            uuid
user_id       uuid (FK → auth.users)
label         text (Casa, Trabalho...)
full_name     text
phone         text
zip_code      text
street        text
number        text
complement    text
neighborhood  text
city          text
state         text (sigla)
is_default    boolean
```

### Tabela: `orders`
```sql
id                uuid
user_id           uuid (FK → auth.users)
status            text (pending | processing | shipped | delivered | cancelled)
payment_method    text (pix | credit_card)
payment_status    text (pending | paid | failed)
payment_id        text (ID do Mercado Pago)
subtotal          numeric
shipping_cost     numeric
total             numeric
address_snapshot  jsonb (snapshot do endereço no momento da compra)
pix_qr_code       text (código PIX para pagamento)
pix_qr_code_base64 text (imagem do QR Code)
created_at        timestamp
updated_at        timestamp
```

### Tabela: `order_items`
```sql
id              uuid
order_id        uuid (FK → orders)
product_id      uuid (FK → products)
variant_id      uuid (FK → product_variants)
product_name    text (snapshot)
product_image   text (snapshot)
size            text (snapshot)
color           text (snapshot)
quantity        integer
unit_price      numeric
```

---

## 📄 Páginas e Rotas

### Páginas Públicas
```
/                           → Home (hero, destaques, categorias)
/produtos                   → Catálogo com filtros
/produtos/[slug]            → Detalhe do produto
/categorias/[slug]          → Listagem por categoria
/busca?q=termo              → Resultados de busca
```

### Fluxo de Compra
```
/carrinho                   → Carrinho de compras
/checkout                   → Checkout (endereço + pagamento)
/checkout/sucesso/[orderId] → Confirmação do pedido
```

### Área do Usuário (autenticado)
```
/entrar                     → Login
/cadastrar                  → Cadastro
/conta                      → Dashboard do usuário
/conta/pedidos              → Histórico de pedidos
/conta/pedidos/[id]         → Detalhe de um pedido
/conta/enderecos            → Gerenciar endereços
/conta/perfil               → Editar perfil
```

### Painel Admin (admin only)
```
/admin                      → Dashboard com métricas
/admin/produtos             → Listar produtos
/admin/produtos/novo        → Cadastrar produto
/admin/produtos/[id]        → Editar produto
/admin/pedidos              → Gerenciar pedidos
/admin/categorias           → Gerenciar categorias
```

### API Routes (Next.js)
```
POST /api/checkout          → Criar pedido + pagamento no MP
POST /api/webhooks/mercadopago → Receber notificações do Mercado Pago
GET  /api/orders/[id]       → Consultar status do pedido
```

---

## 🧩 Funcionalidades Detalhadas

### Catálogo e Produtos
- Listagem com filtros por categoria, tamanho, cor e faixa de preço
- Ordenação por: relevância, menor preço, maior preço, mais novo
- Galeria de imagens com zoom no detalhe do produto
- Seletor de tamanho e cor com indicação de estoque
- Badge de "Em promoção" quando há `compare_price`
- Produtos em destaque na home

### Carrinho
- Drawer lateral que abre ao adicionar produto
- Persistência no `localStorage` (não perde ao recarregar)
- Controle de quantidade, remoção de itens
- Cálculo automático do total
- Contador no ícone do carrinho no header

### Checkout e Pagamento
- Formulário de endereço com busca automática por CEP (ViaCEP)
- Seleção entre PIX e Cartão de Crédito
- **PIX:** Geração de QR Code + código copia-e-cola + timer de expiração
- **Cartão:** Formulário com validação + parcelamento em até 12x
- Polling automático para verificar pagamento do PIX

### Admin Panel
- Dashboard com: total de vendas, pedidos do dia, produtos sem estoque
- CRUD completo de produtos com upload de múltiplas imagens
- Gestão de pedidos com atualização de status
- CRUD de categorias

### Emails Transacionais
- Confirmação de pedido (com resumo e código PIX se aplicável)
- Atualização de status (pedido enviado, entregue)

---

## 📅 Fases de Desenvolvimento

### Fase 1 — Setup e Infraestrutura (2-3 dias)
- [ ] Criar projeto Next.js 14 com TypeScript
- [ ] Configurar Tailwind CSS + shadcn/ui
- [ ] Criar projeto no Supabase e rodar migrations
- [ ] Configurar variáveis de ambiente
- [ ] Primeiro deploy na Vercel (esqueleto)
- [ ] Configurar repositório GitHub com README profissional

### Fase 2 — Autenticação (2 dias)
- [ ] Integrar Supabase Auth
- [ ] Páginas de Login e Cadastro
- [ ] Middleware para rotas protegidas
- [ ] Perfil do usuário

### Fase 3 — Catálogo de Produtos (4-5 dias)
- [ ] Seed do banco com categorias e produtos de exemplo
- [ ] Página de listagem com filtros e ordenação
- [ ] Página de detalhe do produto (galeria, variantes, estoque)
- [ ] Busca por nome/descrição
- [ ] Home page (hero banner, destaques, categorias)

### Fase 4 — Carrinho (2 dias)
- [ ] Estado global do carrinho com Zustand
- [ ] Drawer do carrinho
- [ ] Adicionar/remover/atualizar itens
- [ ] Persistência no localStorage

### Fase 5 — Checkout e Pagamentos (4-5 dias)
- [ ] Página de checkout com formulário de endereço
- [ ] Integração com ViaCEP para busca de endereço
- [ ] Integração Mercado Pago — PIX (QR Code)
- [ ] Integração Mercado Pago — Cartão de crédito
- [ ] Webhook handler para atualizar status do pedido
- [ ] Página de confirmação do pedido

### Fase 6 — Área do Usuário (2 dias)
- [ ] Histórico de pedidos
- [ ] Detalhe do pedido com status de pagamento
- [ ] Gerenciar endereços salvos

### Fase 7 — Painel Admin (3-4 dias)
- [ ] Dashboard com métricas básicas
- [ ] CRUD de categorias
- [ ] CRUD de produtos (com upload de imagens)
- [ ] Gestão de pedidos (atualizar status)

### Fase 8 — Polimento e Deploy Final (2-3 dias)
- [ ] Responsividade em mobile/tablet
- [ ] Loading skeletons e estados de erro
- [ ] SEO (metadata, Open Graph)
- [ ] Seed robusto para demonstração no portfólio
- [ ] README profissional no GitHub
- [ ] Deploy final e testes em produção

**Total estimado: 6 a 8 semanas (trabalhando ~1-2h por dia)**

---

## 📁 Estrutura de Pastas do Projeto

```
rodeio-store/
├── app/                        # Next.js App Router
│   ├── (store)/                # Rotas públicas da loja
│   │   ├── page.tsx            # Home
│   │   ├── produtos/
│   │   ├── categorias/
│   │   ├── busca/
│   │   ├── carrinho/
│   │   └── checkout/
│   ├── (auth)/                 # Login e cadastro
│   ├── conta/                  # Área do usuário
│   ├── admin/                  # Painel admin
│   └── api/                    # API Routes
├── components/
│   ├── ui/                     # Componentes shadcn/ui
│   ├── store/                  # Componentes da loja (ProductCard, etc.)
│   ├── checkout/               # Componentes do checkout
│   └── admin/                  # Componentes do admin
├── lib/
│   ├── supabase/               # Clients do Supabase
│   ├── mercadopago/            # Configuração do MP
│   └── utils.ts                # Utilitários gerais
├── hooks/                      # Custom hooks
├── store/                      # Zustand stores (carrinho)
├── types/                      # TypeScript types
└── supabase/
    └── migrations/             # SQL migrations
```

---

## 🔑 Variáveis de Ambiente Necessárias

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
NEXT_PUBLIC_APP_URL=

# Resend (email)
RESEND_API_KEY=
```

