import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 md:overflow-auto">
        {/* Mobile top bar spacer */}
        <div className="md:hidden h-14" />
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
