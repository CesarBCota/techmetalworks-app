import { FormNovoOrcamentoTimbro } from '@/components/timbro/FormNovoOrcamentoTimbro'

export const dynamic = 'force-dynamic'

export default function NovoOrcamentoTimbroPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Novo Orçamento Timbro</h1>
        <p className="text-text-muted text-sm mt-1">Representação de zinco — calculadora LME</p>
      </div>
      <FormNovoOrcamentoTimbro />
    </div>
  )
}
