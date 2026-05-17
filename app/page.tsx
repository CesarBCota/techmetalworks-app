import { redirect } from 'next/navigation'

// O middleware já redireciona não-autenticados para /login
// Autenticados chegam aqui e são enviados ao dashboard
export default function RootPage() {
  redirect('/dashboard')
}
