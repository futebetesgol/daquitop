# DAQUITOP V2.1 — Cadastro Brasil + funcionamento real

## Mantido funcionando
- Login real via Supabase Auth.
- Cadastro real via Supabase Auth.
- Confirmação de e-mail.
- Sessão persistente e logout.
- Perfil, mural, publicação de texto e rankings conectados ao Supabase.
- Visual DAQUITOP mantido.

## Adicionado na V2.1
- Lista oficial de todas as UFs do Brasil via API de Localidades do IBGE.
- Cidades carregadas automaticamente conforme o estado selecionado.
- Campo Gênero: Homem, Mulher ou Outros.
- Estado, cidade e gênero enviados aos metadados do cadastro.
- Ao primeiro login, o gênero é sincronizado com `profiles.gender` quando necessário.

## Variáveis no Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## IMPORTANTE — SQL V2.1
Antes de testar um cadastro novo, execute `supabase_v2_1.sql` no SQL Editor do projeto DAQUITOP.
