# DAQUITOP V2 — Login + Cadastro Real

Atualização funcional conectada ao Supabase.

## O que foi adicionado
- Login real com e-mail e senha via Supabase Auth.
- Cadastro real com nome, @usuário, UF e cidade.
- Sessão persistente e botão Sair.
- Perfil do usuário carregado da tabela `profiles`.
- Mural carregado da tabela `posts`.
- Publicação de texto real no mural.
- Top 3 pessoas e comércios carregados do banco.
- Remoção dos nomes/rankings fictícios da V1.

## Variáveis obrigatórias no Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Observação
Se a confirmação de e-mail estiver ativada no Supabase, o usuário precisará confirmar o e-mail antes do primeiro login.
