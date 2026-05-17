import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const senhaHash = await bcrypt.hash('tecno2024', 12)

  // ── Usuários ────────────────────────────────────────────────────────────────
  const cesar = await db.usuario.upsert({
    where: { email: 'cesaraugusto@techmetalworks.com.br' },
    update: {},
    create: {
      nome: 'César Augusto',
      email: 'cesaraugusto@techmetalworks.com.br',
      senha: senhaHash,
      ativo: true,
    },
  })
  console.log(`✅ Usuário: ${cesar.nome} (${cesar.email})`)

  const socio = await db.usuario.upsert({
    where: { email: 'cezarcota@techmetalworks.com.br' },
    update: {},
    create: {
      nome: 'Sócio',
      email: 'cezarcota@techmetalworks.com.br',
      senha: senhaHash,
      ativo: true,
    },
  })
  console.log(`✅ Usuário: ${socio.nome} (${socio.email})`)

  // ── Representantes ───────────────────────────────────────────────────────────
  // Representante.id é cuid (String) — não existe campo @unique em 'nome',
  // portanto usamos findFirst + create para evitar duplicatas.
  let marcelo = await db.representante.findFirst({ where: { nome: 'Marcelo' } })
  if (!marcelo) {
    marcelo = await db.representante.create({
      data: { nome: 'Marcelo', percComissao: 2.65, ativo: true },
    })
  }
  console.log(`✅ Representante: ${marcelo.nome} (${marcelo.percComissao}%)`)

  let repPadrao = await db.representante.findFirst({ where: { nome: 'Representante Padrão' } })
  if (!repPadrao) {
    repPadrao = await db.representante.create({
      data: { nome: 'Representante Padrão', percComissao: 3.0, ativo: true },
    })
  }
  console.log(`✅ Representante: ${repPadrao.nome} (${repPadrao.percComissao}%)`)

  // ── Cliente de exemplo ───────────────────────────────────────────────────────
  let clienteExemplo = await db.cliente.findFirst({ where: { cnpj: '00000000000000' } })
  if (!clienteExemplo) {
    clienteExemplo = await db.cliente.create({
      data: {
        razaoSocial:   'Prefeitura Municipal Exemplo',
        cnpj:          '00000000000000',
        email:         'compras@prefexemplo.gov.br',
        telefone:      '(31) 3333-4444',
        solicitante:   'João da Silva',
        fatLogradouro: 'Rua das Flores, 100',
        fatBairro:     'Centro',
        fatCidade:     'Belo Horizonte',
        fatUf:         'MG',
        fatCep:        '30000-000',
        entLogradouro: 'Rua das Flores, 100',
        entBairro:     'Centro',
        entCidade:     'Belo Horizonte',
        entUf:         'MG',
        entCep:        '30000-000',
      },
    })
  }
  console.log(`✅ Cliente exemplo: ${clienteExemplo.razaoSocial}`)

  console.log('\n🎉 Seed concluído!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('   ┌─────────────────────────────────────────────┐')
  console.log('   │  Usuário 1 — César                          │')
  console.log('   │  Email: cesaraugusto@techmetalworks.com.br  │')
  console.log('   │  Senha: tecno2024                           │')
  console.log('   ├─────────────────────────────────────────────┤')
  console.log('   │  Usuário 2 — Sócio                          │')
  console.log('   │  Email: cezarcota@techmetalworks.com.br     │')
  console.log('   │  Senha: tecno2024                           │')
  console.log('   └─────────────────────────────────────────────┘')
  console.log('\n⚠️  Altere as senhas após o primeiro login!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
