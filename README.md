# Eleições 2026 — Front

## Rodar

```bash
npm install
npx vercel dev
```

As rotas de login e dados são Vercel Functions; `npm run dev` inicia apenas o Vite e não executa essas funções localmente.

## Configurar acesso na Vercel

Adicione estas variáveis em **Project Settings → Environment Variables** e faça um novo deploy:

- `SITE_PASSWORD`: senha que será solicitada aos visitantes.
- `SESSION_SECRET`: segredo aleatório com pelo menos 32 bytes, usado para assinar os cookies de sessão.

Use valores próprios e fortes; `.env.example` contém apenas exemplos. Não use prefixo `VITE_` nessas variáveis, pois elas devem permanecer no servidor.

O login cria um cookie `HttpOnly`, `Secure` em produção e `SameSite=Strict`, válido por sete dias. Os dados só são servidos pela rota autenticada `/api/data`.

## Arquivo de dados

Coloque o arquivo gerado pelo script Python em:

```text
private-data/votos_eleicoes.json
```

O front espera a estrutura:

```json
{
  "CAXIAS DO SUL": {
    "Deputado Estadual": { "brancos": 123, "nulos": 456 },
    "votos": {
      "deputado-estadual": [
        { "nome": "NOME", "partido": "ABC", "qtdVotos": 1000 }
      ]
    }
  }
}
```
