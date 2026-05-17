# Deploy — Tech Metalworks App

Guia completo para rodar localmente e colocar em produção.

---

## Rodar localmente

### 1. Instalar dependências

```bash
cd techmetalworks-app
npm install
```

### 2. Criar o arquivo `.env` (já existe no repositório)

Verifique se `.env` contém:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="techmetalworks-secret-mude-em-producao-2024"
NODE_ENV=development
```

### 3. Criar o banco e popular com dados iniciais

```bash
npm run db:push    # cria/atualiza o banco SQLite (sem migrations)
npm run db:seed    # cria os usuários e dados de exemplo
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em: **http://localhost:3000**

---

## Credenciais iniciais

| Usuário | E-mail                       | Senha      |
|---------|------------------------------|------------|
| César   | cesaraugusto@techmetalworks.com.br | tecno2024  |
| Sócio   | cezarcota@techmetalworks.com.br    | tecno2024  |

> ⚠️ Troque as senhas após o primeiro login. Em produção, altere também o `SESSION_SECRET`.

---

## Opção A — Deploy no Railway (recomendado)

Railway é a opção mais simples para quem não quer gerenciar servidor.

### 1. Criar conta e projeto

1. Acesse [railway.app](https://railway.app) e crie uma conta.
2. Clique em **New Project → Deploy from GitHub repo**.
3. Conecte o repositório `techmetalworks-app`.

### 2. Configurar variáveis de ambiente

No painel do Railway, vá em **Variables** e adicione:

```
DATABASE_URL=file:./data/prod.db
SESSION_SECRET=<string_aleatória_segura_mínimo_32_chars>
NODE_ENV=production
```

Gere o SESSION_SECRET com:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Adicionar volume persistente

SQLite precisa de disco persistente. No Railway:

1. Vá em **Add Service → Volume**.
2. Monte em `/app/data`.
3. Certifique-se de que `DATABASE_URL=file:./data/prod.db` aponta para essa pasta.

### 4. Configurar build e start

Railway detecta Next.js automaticamente. Confirme:

- **Build Command:** `npm run build`
- **Start Command:** `npm run db:push && npm run db:seed && npm start`

> O `db:seed` usa `upsert` — é seguro rodar em cada deploy (não duplica dados).

### 5. Acessar

O Railway fornece uma URL pública no formato `https://seu-app.up.railway.app`.

---

## Opção B — Deploy em VPS própria (Ubuntu 22.04)

### 1. Instalar Node.js no servidor

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20

npm install -g pm2
```

### 2. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/techmetalworks-app.git
cd techmetalworks-app
npm install
```

### 3. Criar arquivo `.env.production`

```bash
mkdir -p data

cat > .env.production << 'EOF'
DATABASE_URL=file:./data/prod.db
SESSION_SECRET=TROQUE_ISSO_POR_STRING_SEGURA_DE_PELO_MENOS_32_CHARS
NODE_ENV=production
EOF
```

### 4. Preparar banco e build

```bash
npm run db:push     # cria o banco
npm run db:seed     # cria usuários iniciais
npm run build       # gera build de produção
```

### 5. Iniciar com PM2

```bash
pm2 start npm --name "techmetalworks" -- start
pm2 save
pm2 startup   # configure para iniciar no boot
```

### 6. Nginx como proxy reverso (recomendado)

```nginx
# /etc/nginx/sites-available/techmetalworks
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/techmetalworks /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS com Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br
```

---

## Opção C — Migrar de SQLite para PostgreSQL (dados críticos)

Para produção com múltiplos usuários simultâneos, use PostgreSQL.

### 1. Alterar provider no schema

Edite `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Atualizar DATABASE_URL

```
DATABASE_URL=postgresql://usuario:senha@host:5432/techmetalworks
```

### 3. Criar o banco

```bash
npm run db:push    # aplica o schema no PostgreSQL
npm run db:seed    # cria usuários iniciais
```

---

## Atualizar para nova versão

```bash
cd techmetalworks-app
git pull origin main
npm install
npm run db:push     # aplica mudanças de schema sem apagar dados
npm run build
pm2 restart techmetalworks
```

---

## Backup do banco de dados (SQLite)

```bash
# crontab -e
0 2 * * * cp /caminho/techmetalworks-app/data/prod.db /backups/prod-$(date +\%Y\%m\%d).db
0 3 * * * find /backups -name "prod-*.db" -mtime +30 -delete
```

---

## Variáveis de ambiente — referência completa

| Variável          | Obrigatório | Descrição                              | Exemplo                        |
|-------------------|-------------|----------------------------------------|--------------------------------|
| `DATABASE_URL`    | ✅           | Caminho do banco SQLite ou URL Postgres | `file:./data/prod.db`         |
| `SESSION_SECRET`  | ✅           | Chave secreta da sessão (iron-session)  | string aleatória ≥ 32 chars   |
| `NODE_ENV`        | ✅           | Modo de execução                        | `production`                  |
| `PORT`            | ❌           | Porta HTTP (padrão: 3000)              | `3000`                        |

---

## Checklist de go-live

- [ ] `SESSION_SECRET` trocado para valor único e seguro (não reutilize o padrão do `.env`)
- [ ] `NODE_ENV=production` definido
- [ ] `npm run db:push` executado com sucesso
- [ ] `npm run db:seed` executado — usuários criados
- [ ] `npm run build` bem-sucedido (sem erros TypeScript)
- [ ] App acessível na URL pública
- [ ] Login funcionando com `cesaraugusto@techmetalworks.com.br` / `tecno2024`
- [ ] Criar um orçamento de teste e verificar PDF
- [ ] Senhas de ambos os usuários trocadas após primeiro acesso
- [ ] Backup configurado (SQLite) ou banco gerenciado (PostgreSQL)
- [ ] HTTPS configurado (certbot ou proxy)
