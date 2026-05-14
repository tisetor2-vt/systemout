# Sistema de Catalogo Digital + Gestao de Loja

Projeto em **Next.js + Tailwind + Supabase** com foco mobile-first e deploy na Vercel.

## Acesso admin

- Acesso oculto pela busca digitando `qaz@123`.
- Login mestre:
  - Email: `admin@gmail.com`
  - Senha: `ativador`

## Rodar localmente

```bash
cd /Users/danielhenrique/Desktop/systemcompleted
npm install
npm run dev
```

## Variaveis de ambiente

Crie `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Configuracao Supabase (primeira vez)

1. Crie o projeto no Supabase.
2. Rode o SQL de `supabase/schema.sql` no SQL Editor.
3. Em **Database > Replication**, habilite realtime para:
   - `products`
   - `categories`
   - `store_settings`
   - `store_banners`
4. Crie usuario admin no Auth (`admin@gmail.com` / `ativador`).
5. Insira perfil admin em `public.user_profiles` com o mesmo `id` do `auth.users`.

## Checklist de atualizar e publicar online

Sempre que alterar o site:

1. Validar build local:

```bash
npm run build
```

2. Fazer login na Vercel (se necessario):

```bash
npx vercel login
```

3. Vincular projeto (apenas na primeira vez):

```bash
npx vercel link
```

4. Deploy em producao:

```bash
npx vercel --prod --yes
```

5. Conferir o link retornado no final do comando.

## Fluxo rapido (dia a dia)

Depois de tudo configurado, geralmente basta:

```bash
npx vercel --prod --yes
```

## Se der erro de token/auth na Vercel

```bash
npx vercel logout
npx vercel login
npx vercel --prod --yes
```

## Estrutura

- `src/app` - rotas do catalogo e admin
- `src/components/catalog` - experiencia publica
- `src/components/admin` - modulos de gestao
- `src/hooks` - hooks de dados/realtime/auth
- `src/lib/supabase` - cliente e utilitarios Supabase
- `supabase/schema.sql` - banco + RLS + storage
