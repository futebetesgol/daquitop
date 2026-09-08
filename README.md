# DAQUITOP V3.0 COMPLETA

Atualização funcional do DAQUITOP mantendo o visual escuro azul/roxo/magenta da V2.1.

## Recursos

- Cadastro e login Supabase
- Estados e cidades oficiais via API do IBGE
- Perfil completo com foto, capa, bio, atividade, telefone público e site
- Configurações de perfil
- Mural real com texto, foto, curtidas e comentários
- Seguidores locais e ranking de populares
- Cadastro, perfil, edição, publicações e avaliações de comércios
- Explorar qualquer cidade sem mudar a cidade cadastrada
- Publicar no mural da cidade visitada
- Mensagens privadas
- Suporte com chamados e anexo de imagem
- Competições Melhor do Mês e Melhor do Ano com 1 voto por conta
- Upload de imagens pelo Supabase Storage

## Instalação

1. Execute `supabase_v3_completa.sql` no SQL Editor do Supabase.
2. Depois envie para a raiz do GitHub os arquivos/pastas do projeto, substituindo os atuais.
3. Aguarde o deploy automático do Vercel.
4. Teste cada módulo com duas contas.

## Variáveis no Vercel

Mantém as mesmas da V2.1:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Não use service role no frontend.
