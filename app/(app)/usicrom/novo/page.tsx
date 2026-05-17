import { db } from '@/lib/db'
import FormNovoOrcamento from '@/components/usicrom/FormNovoOrcamento'

export default async function NovoOrcamentoUsicromPage() {
  const representantes = await db.representante.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
  })

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
          <a href="/usicrom" className="hover:text-text">Usicrom</a>
          <span>›</span>
          <span>Novo Orçamento</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Novo Orçamento Usicrom</h1>
        <p className="text-text-muted text-sm mt-1">Validade: 10 dias · Origem: Minas Gerais</p>
      </div>

      <FormNovoOrcamento representantes={representantes} />
    </div>
  )
}
