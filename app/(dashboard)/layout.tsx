import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import MobileHeader from '@/components/MobileHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-[100dvh] tech-bg scanline">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader profile={profile} />
        {/* paddingBottom = nav height (64px) + iOS home indicator safe area */}
        <main
          className="flex-1 overflow-auto relative z-10 md:pb-0"
          style={{ paddingBottom: 'max(5rem, calc(4rem + env(safe-area-inset-bottom)))' }}
        >
          {children}
        </main>
      </div>
      <MobileNav profile={profile} />
    </div>
  )
}
