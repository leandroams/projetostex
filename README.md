# STEX - Sistema de Ordens de Serviço

Sistema web feito para a STEX Assistência Técnica controlar os clientes, os aparelhos e as
Ordens de Serviço (OS). Projeto da Prática Extensionista (Prestação de Serviço - 100 horas)
do curso de Análise e Desenvolvimento de Sistemas.

## O que tem no sistema

- Login com usuário e senha
- Cadastro de usuários pelo próprio sistema
- Cadastro de clientes e dos aparelhos de cada cliente
- Abertura de OS com o defeito relatado
- Controle de status: Em Análise, Aguardando Peça, Pronto e Entregue
- Histórico das mudanças de status
- Comprovante de entrada e de saída em PDF
- Botão para avisar o cliente pelo WhatsApp
- Histórico dos serviços entregues no mês com os valores (fica no menu ADM)
- Funciona no computador e no celular

## Tecnologias

- React + TypeScript (Vite)
- Tailwind CSS
- Supabase (banco PostgreSQL + login)
- jsPDF para os comprovantes
- Vercel para hospedar
