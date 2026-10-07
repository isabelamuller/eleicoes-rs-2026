# Eleições 2026 — Front

## Rodar

```bash
npm install
npm run dev
```

Coloque o arquivo gerado pelo script Python em:

```text
public/votos_eleicoes.json
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
