#!/bin/bash
set -e

echo "================================================"
echo "  TECNO LUMEN — Instalação do Sistema"
echo "================================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale em: https://nodejs.org (versão 18+)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js versão 18+ necessária. Versão atual: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# Gerar cliente Prisma
echo ""
echo "🗄️  Gerando cliente Prisma..."
npx prisma generate

# Criar banco de dados
echo ""
echo "🗄️  Criando banco de dados..."
npx prisma db push

# Popular dados iniciais
echo ""
echo "🌱 Populando dados iniciais..."
npx tsx scripts/seed.ts

echo ""
echo "================================================"
echo "  ✅ Instalação concluída!"
echo "================================================"
echo ""
echo "  Para iniciar o servidor:"
echo "  → npm run dev"
echo ""
echo "  Acesse: http://localhost:3000"
echo ""
echo "  Credenciais:"
echo "  → Email: cesar@tecnolumen.com.br"
echo "  → Senha: tecno2024"
echo ""
echo "  ⚠️  IMPORTANTE: Altere a senha após o primeiro acesso!"
echo "================================================"
