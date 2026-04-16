This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Cron Jobs

O projeto inclui um cron job configurado via Vercel para manter o banco de dados Supabase (free tier) sempre ativo. O free tier do Supabase pausa projetos inativos após 7 dias sem requisições.

- **Rota:** `GET /api/crons/keep-alive`
- **Frequência:** A cada 6 horas (`0 */6 * * *`)
- **O que faz:** Executa uma query simples (`SELECT id FROM categories LIMIT 1`) para registrar atividade no banco
- **Autenticação:** Requer o header `Authorization: Bearer <CRON_SECRET>` (a Vercel injeta automaticamente)

Para funcionar, adicione a variável de ambiente `CRON_SECRET` no painel da Vercel. A Vercel gera esse valor automaticamente ao detectar o `vercel.json` com crons configurados.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
