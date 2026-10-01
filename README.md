# STEX - Sistema de Ordens de Serviço

Sistema web feito para a STEX Assistência Técnica controlar os clientes, os aparelhos e as
Ordens de Serviço (OS). Projeto da Prática Extensionista (Prestação de Serviço - 100 horas)
do curso de Análise e Desenvolvimento de Sistemas.

## O que tem no sistema

- Login com usuário e senha
- Cadastro de clientes e dos aparelhos de cada cliente
- Abertura de OS com o defeito relatado
- Controle de status: Em Análise, Aguardando Peça, Pronto e Entregue
- Histórico das mudanças de status
- Comprovante de entrada e de saída em PDF
- Botão para avisar o cliente pelo WhatsApp
- Funciona no computador e no celular

## Tecnologias

- React + TypeScript (Vite)
- Tailwind CSS
- Supabase (banco PostgreSQL + login)
- jsPDF para os comprovantes
- Vercel para hospedar

## Como rodar

Precisa ter o Node.js instalado.

```bash
npm install
```

```bash
npm run dev
```

Depois é só abrir http://localhost:5173

## Configuração do Supabase

1. Criar um projeto no https://supabase.com
2. No SQL Editor, colar e rodar o arquivo `supabase/schema.sql` (cria as tabelas)
3. Copiar o arquivo `.env.example` com o nome `.env` e colocar a URL e a chave do projeto
   (ficam em Project Settings > API)

### Usuários

O login é por nome de usuário. Como o Supabase só trabalha com e-mail, o sistema completa o
usuário com `@stex.local` por trás. Então para criar um usuário:

1. No Supabase ir em Authentication > Users > Add user
2. No e-mail colocar `usuario@stex.local` (exemplo: `adewerton@stex.local`)
3. Colocar a senha e marcar "Auto Confirm User"

Na tela de login a pessoa digita só `adewerton` e a senha.

## Publicar na Vercel

1. Subir o projeto para o GitHub
2. Importar o repositório na Vercel
3. Cadastrar as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
4. Fazer o deploy

## Organização das pastas

```
supabase/schema.sql   -> tabelas e regras do banco
src/api.ts            -> consultas ao banco
src/utils.ts          -> status e funções de formatação
src/pdf.ts            -> geração dos comprovantes
src/empresa.ts        -> dados da loja que saem no PDF
src/components        -> menu, formulários, etc
src/pages             -> telas do sistema
```

## Banco de dados

```
clientes -> aparelhos -> ordens_servico -> os_historico
```

Um cliente pode ter vários aparelhos e cada aparelho pode ter várias OS. As regras de
mudança de status ficam no banco (trigger), então não dá para pular etapa, por exemplo
entregar um aparelho que não está pronto.
