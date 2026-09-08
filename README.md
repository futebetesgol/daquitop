# CIDARANK V4.0 — Atualização Profunda

Atualização baseada na V3.1 funcional, preservando login, cadastro, mural, curtidas, comentários, seguidores, comércio, avaliações, mensagens, suporte e competições.

## O que muda na V4.0
- Contexto de cidade reforçado com `city_key/state_key` no Supabase para pessoas, comércios, posts e competições.
- Mural, populares, comércios e ranking carregados sempre pela cidade oficial do perfil.
- Explorar Cidade busca dados reais da cidade visitada sem alterar a cidade de cadastro.
- Perfil com Medalhas e Troféus dinâmicos: Top 1/2/3 Popular, líder do mês, líder do ano e Destaque Local.
- Comércio pode publicar texto + foto de produto/comida/serviço.
- Publicação do comércio usa logo do comércio quando houver.
- Lista ampla de categorias comerciais, incluindo Restaurante, Padaria, Pizzaria e muitas outras.
- Mensagens, suporte, avaliações e demais módulos da V3.1 permanecem.

## Instalação
1. Execute `supabase_v4_profunda.sql` no Supabase SQL Editor.
2. Envie `app`, `lib`, `package.json`, `next.config.js` e `README.md` para o repositório GitHub.
3. Aguarde o deploy do Vercel.
4. Teste com duas contas em cidades diferentes e duas contas na mesma cidade.

Status: EM TESTE até validar no Vercel/Supabase.
