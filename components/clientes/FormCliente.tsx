'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ESTADOS_BRASILEIROS } from '@/lib/icms'

interface ClienteData {
  id?: string
  razaoSocial?: string
  nomeFantasia?: string | null
  cnpj?: string | null
  inscEstadual?: string | null
  solicitante?: string | null
  cargo?: string | null
  telefone?: string | null
  email?: string | null
  // Faturamento
  fatLogradouro?: string | null
  fatBairro?: string | null
  fatCidade?: string | null
  fatUf?: string | null
  fatCep?: string | null
  // Cobrança
  cobLogradouro?: string | null
  cobBairro?: string | null
  cobCidade?: string | null
  cobUf?: string | null
  cobCep?: string | null
  // Entrega
  entLogradouro?: string | null
  entBairro?: string | null
  entCidade?: string | null
  entUf?: string | null
  entCep?: string | null
}

interface Props {
  cliente?: ClienteData
}

export function FormCliente({ cliente }: Props) {
  const router = useRouter()
  const isEdicao = Boolean(cliente?.id)

  const [form, setForm] = useState<ClienteData>({
    razaoSocial: cliente?.razaoSocial || '',
    cnpj: cliente?.cnpj || '',
    inscEstadual: cliente?.inscEstadual || '',
    solicitante: cliente?.solicitante || '',
    cargo: cliente?.cargo || '',
    telefone: cliente?.telefone || '',
    email: cliente?.email || '',
    fatLogradouro: cliente?.fatLogradouro || '',
    fatBairro: cliente?.fatBairro || '',
    fatCidade: cliente?.fatCidade || '',
    fatUf: cliente?.fatUf || '',
    fatCep: cliente?.fatCep || '',
    cobLogradouro: cliente?.cobLogradouro || '',
    cobBairro: cliente?.cobBairro || '',
    cobCidade: cliente?.cobCidade || '',
    cobUf: cliente?.cobUf || '',
    cobCep: cliente?.cobCep || '',
    entLogradouro: cliente?.entLogradouro || '',
    entBairro: cliente?.entBairro || '',
    entCidade: cliente?.entCidade || '',
    entUf: cliente?.entUf || '',
    entCep: cliente?.entCep || '',
  })

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'faturamento' | 'entrega' | 'cobranca'>('dados')

  function set(campo: keyof ClienteData, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  function copiarFatParaEnt() {
    setForm(prev => ({
      ...prev,
      entLogradouro: prev.fatLogradouro,
      entBairro: prev.fatBairro,
      entCidade: prev.fatCidade,
      entUf: prev.fatUf,
      entCep: prev.fatCep,
    }))
  }

  async function salvar() {
    if (!form.razaoSocial) {
      setErro('Razão Social é obrigatória.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      const url = isEdicao ? `/api/clientes/${cliente!.id}` : '/api/clientes'
      const method = isEdicao ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error || 'Erro ao salvar.')
        return
      }
      router.push(`/clientes/${data.id}`)
      router.refresh()
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!confirm(`Excluir "${form.razaoSocial}"? Esta ação não pode ser desfeita.`)) return
    setExcluindo(true)
    try {
      const res = await fetch(`/api/clientes/${cliente!.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/clientes')
        router.refresh()
      } else {
        const d = await res.json()
        setErro(d.error || 'Não foi possível excluir.')
      }
    } finally {
      setExcluindo(false)
    }
  }

  const abas = [
    { key: 'dados', label: 'Dados Gerais' },
    { key: 'faturamento', label: 'Faturamento' },
    { key: 'entrega', label: 'Entrega' },
    { key: 'cobranca', label: 'Cobrança' },
  ] as const

  return (
    <div className="space-y-4">
      {/* Abas */}
      <div className="flex gap-0 border-b border-bg-border overflow-x-auto">
        {abas.map(a => (
          <button
            key={a.key}
            onClick={() => setAbaAtiva(a.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              abaAtiva === a.key
                ? 'text-blue-glow border-b-2 border-blue-glow'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── DADOS GERAIS ── */}
      {abaAtiva === 'dados' && (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Razão Social *</label>
              <input className="input" value={form.razaoSocial || ''} onChange={e => set('razaoSocial', e.target.value)} placeholder="Nome empresarial completo" />
            </div>
            <div>
              <label className="label">CNPJ</label>
              <input className="input mono" value={form.cnpj || ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" maxLength={18} />
            </div>
            <div>
              <label className="label">Inscrição Estadual</label>
              <input className="input" value={form.inscEstadual || ''} onChange={e => set('inscEstadual', e.target.value)} placeholder="IE" />
            </div>
            <div>
              <label className="label">Solicitante / Contato</label>
              <input className="input" value={form.solicitante || ''} onChange={e => set('solicitante', e.target.value)} placeholder="Nome do contato" />
            </div>
            <div>
              <label className="label">Cargo</label>
              <input className="input" value={form.cargo || ''} onChange={e => set('cargo', e.target.value)} placeholder="Comprador, Engenheiro..." />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com.br" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.telefone || ''} onChange={e => set('telefone', e.target.value)} placeholder="(00) 0000-0000" />
            </div>
          </div>
        </div>
      )}

      {/* ── FATURAMENTO ── */}
      {abaAtiva === 'faturamento' && (
        <div className="card">
          <EnderecoFields label="Faturamento" prefix="fat" form={form} set={set} />
        </div>
      )}

      {/* ── ENTREGA ── */}
      {abaAtiva === 'entrega' && (
        <div className="card space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={copiarFatParaEnt} className="btn-ghost text-sm">
              ↙ Copiar endereço de faturamento
            </button>
          </div>
          <EnderecoFields label="Entrega" prefix="ent" form={form} set={set} />
        </div>
      )}

      {/* ── COBRANÇA ── */}
      {abaAtiva === 'cobranca' && (
        <div className="card">
          <EnderecoFields label="Cobrança" prefix="cob" form={form} set={set} />
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm">
          {erro}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {isEdicao && (
            <button onClick={excluir} disabled={excluindo} className="btn-danger text-sm">
              {excluindo ? 'Excluindo...' : 'Excluir Cliente'}
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Endereço genérico ──
function EnderecoFields({
  prefix,
  form,
  set,
}: {
  label: string
  prefix: 'fat' | 'ent' | 'cob'
  form: ClienteData
  set: (campo: keyof ClienteData, val: string) => void
}) {
  const f = (s: string) => `${prefix}${s.charAt(0).toUpperCase() + s.slice(1)}` as keyof ClienteData

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="label">Logradouro</label>
        <input className="input" value={(form[f('logradouro')] as string) || ''} onChange={e => set(f('logradouro'), e.target.value)} placeholder="Rua, Avenida..." />
      </div>
      <div>
        <label className="label">Bairro</label>
        <input className="input" value={(form[f('bairro')] as string) || ''} onChange={e => set(f('bairro'), e.target.value)} />
      </div>
      <div>
        <label className="label">CEP</label>
        <input className="input mono" value={(form[f('cep')] as string) || ''} onChange={e => set(f('cep'), e.target.value)} placeholder="00000-000" maxLength={9} />
      </div>
      <div>
        <label className="label">Cidade</label>
        <input className="input" value={(form[f('cidade')] as string) || ''} onChange={e => set(f('cidade'), e.target.value)} />
      </div>
      <div>
        <label className="label">UF</label>
        <select className="input" value={(form[f('uf')] as string) || ''} onChange={e => set(f('uf'), e.target.value)}>
          <option value="">UF</option>
          {ESTADOS_BRASILEIROS.map(uf => (
            <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
