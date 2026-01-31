# RC Acervo Backend

Backend do Sistema de Biblioteca de Fotos da RC Agropecuária.

## Estrutura

```
├── src/
│   ├── routes/
│   │   ├── upload.routes.ts    # POST /api/upload/presigned
│   │   ├── media.routes.ts     # GET /api/media
│   │   └── folder.routes.ts    # GET /api/folders
│   ├── services/
│   │   └── backblaze.service.ts # Integração com B2
│   └── server.ts               # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Deploy no Render

1. Conecte este repositório no Render
2. Configure Environment Variables:
   - `FRONTEND_URL`: URL do seu frontend
   - `B2_ACCOUNT_ID`: Sua Account ID do Backblaze
   - `B2_APPLICATION_KEY`: Sua Application Key
   - `B2_BUCKET_NAME`: Nome do bucket
   - `B2_BUCKET_ID`: ID do bucket
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload/presigned` - Gera URL para upload
- `POST /api/upload/complete` - Confirma upload
- `GET /api/upload/test` - Testa conexão B2
- `GET /api/media` - Lista mídias
- `GET /api/folders` - Lista pastas
