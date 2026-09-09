# CIDARANK V6.1 — Administração Nacional + Rankings Semana/Mês/Ano

Versão baseada na V6 funcional do CIDARANK.

## Atualizações principais

- Menu lateral simplificado: **Mural removido**; a **Início** concentra as publicações da cidade.
- Painel do Dono com filtros nacionais usando a **API oficial de localidades do IBGE**:
  - todos os estados do Brasil;
  - todos os municípios do estado selecionado;
  - Brasil inteiro, estado inteiro ou cidade específica.
- Os filtros nacionais atuam em Visão geral, Tempo real, Usuários, Moderação, Comércios, Rankings e Suporte.
- Painel administrativo não carrega todas as publicações comuns, evitando excesso de dados.
- Tempo real monitora eventos principais, sem encher o painel com cada publicação.
- Rankings por **Semana**, **Mês** e **Ano**, com busca por estado/cidade.
- Área pública de Populares também oferece **Popular da Semana**, **Popular do Mês** e **Popular do Ano**.
- Dono principal continua protegido: `cidarankk@gmail.com`.

## Passo obrigatório no Supabase

Execute **uma vez**:

`SUPABASE_CIDARANK_V6_1_RANK_SEMANAL.sql`

Esse SQL habilita o período semanal na votação e cria índices para filtros nacionais.

## Publicação

Depois do SQL mostrar `Success`, envie as pastas/arquivos do projeto ao GitHub e aguarde o Vercel marcar o deployment como `Ready / Production`.


## V6.5 — Pódios flutuantes automáticos
Inclui pódios visuais TOP 3 para semana, mês, ano e popular da cidade, com 1º lugar central/elevado. Também deixa Estado e Brasil preparados visualmente e bloqueados como **EM BREVE**. Não exige SQL adicional além da V6.4.
