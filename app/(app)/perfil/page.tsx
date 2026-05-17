import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import TrocarSenhaForm from '@/components/perfil/TrocarSenhaForm'

export const metadata = { title: 'Meu Perfil — Tech Metalworks' }

export default async function PerfilPage() {
  const session = await requireAuth()
  if (!session) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie suas informações de acesso</p>
      </div>

      {/* Card — dados do usuário */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Dados da conta</h2>
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</span>
            <p className="text-sm text-gray-900 mt-0.5">{session.nome ?? '—'}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">E-mail</span>
            <p className="text-sm text-gray-900 mt-0.5">{session.email ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Card — troca de senha */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Alterar senha</h2>
        <p className="text-sm text-gray-500 mb-5">
          Use uma senha forte com pelo menos 6 caracteres.
        </p>
        <TrocarSenhaForm />
      </div>
    </div>
  )
}
