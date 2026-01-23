# Testes End-to-End (E2E)

Estes testes fazem chamadas reais para as APIs das LLMs (OpenAI e Google Gemini).

## Configuração

### Onde colocar o arquivo .env?

**Coloque o arquivo `.env` na raiz do pacote `packages/ai/`** (não dentro de `tests/e2e/`).

1. Copie o arquivo de exemplo:
   ```bash
   cd packages/ai
   cp tests/e2e/env.example .env
   ```

2. Preencha as variáveis de ambiente no arquivo `.env`:
   - `OPENAI_API_KEY`: Sua chave da API da OpenAI (necessária para testes com GPT)
   - `GOOGLE_GEMINI_TOKEN`: Seu token da API do Google Gemini (necessária para testes com Gemini)
   - `OPENROUTER_API_KEY`: Sua chave da API do OpenRouter (necessária para testes com OpenRouter)

### Como funciona?

O arquivo `.env` é carregado automaticamente pelo `dotenv` configurado no `vitest.config.ts`. O arquivo `.env` deve estar em `packages/ai/.env` e será carregado quando você executar `pnpm test:e2e`.

## Executando os testes

### Todos os testes E2E
```bash
pnpm test:e2e
```

### Apenas testes unitários
```bash
pnpm test:unit
```

### Todos os testes (unitários + E2E)
```bash
pnpm test
```

## Notas

- Os testes E2E são marcados com `skipIf` e só serão executados se as respectivas API keys estiverem configuradas
- Os testes E2E têm timeout de 30 segundos devido às chamadas de API
- **Atenção**: Estes testes consomem créditos das suas APIs. Use com moderação em desenvolvimento
