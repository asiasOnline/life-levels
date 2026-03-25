import SideNav from "@/components/layout/nav/side-nav"
import TopNav from "@/components/layout/nav/top-nav"
import { getUserStats } from "@/lib/actions/stats"
import { GoldProvider } from "@/lib/contexts/gold-context"

export default async function AppLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    const statsResult = await getUserStats()
    const initialGold = statsResult.success ? statsResult.data.gold : 0

    return (
        <div className="w-screen h-screen flex overflow-x-hidden">
          <SideNav />
          <div className="w-full">
            <TopNav />
            <GoldProvider initialBalance={initialGold}>
              <div className="h-full p-5 bg-stone-100">
                {children}
              </div>
            </GoldProvider>
          </div>
        </div>
    )
  }