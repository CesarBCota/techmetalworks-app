import { FormCliente } from '@/components/clientes/FormCliente'

export const dynamic = 'force-dynamic'

export default function NovoClientePage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Novo Cliente</h1>
        <p className="text-text-muted text-sm mt-1">Preencha os dados cadastrais</p>
      </div>
      <FormCliente />
    </div>
  )
}
