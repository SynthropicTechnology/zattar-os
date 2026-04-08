# Change: Integrar fluxo de assinatura digital (preview + finalizacao) da Assinatura Digital

## Why

Completar a migracao da Assinatura Digital para o backend Synthropic, trazendo o fluxo de assinatura digital (preview de PDF, finalizacao, registro de assinaturas e integracao externa) sobre as tabelas criadas.

## What Changes

- Adicionar servico de assinatura com preview de PDF, finalizacao e rastreio de sessoes/assinaturas
- Integrar com armazenamento (Backblaze/S3) para salvar PDFs/arquivos de assinatura
- Integrar com n8n (ou gateway externo) para buscar cliente/acao e enviar assinatura concluida
- Adicionar rotas protegidas para preview/finalizar e listar sessoes/assinaturas
- Validar payloads (CPF/CNPJ, geolocalizacao, base64) e registrar metadados de seguranca

## Impact

- Affected specs: assinatura-digital-assinatura
- Affected code: backend form sign services/rotas, storage provider, n8n/external api gateway
