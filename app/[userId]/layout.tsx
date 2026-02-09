import SideNav from "@/components/layout/side-nav"
import TopNav from "@/components/layout/top-nav"

export default function DashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className="w-screen h-screen flex overflow-x-hidden">
          <SideNav />
          <div className="w-full">
            <TopNav />
            <div className="h-full p-5 bg-stone-100">
              {children}
            </div>
          </div>
        </div>
    )
  }