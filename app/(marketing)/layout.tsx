import HomeNav from "@/components/layout/home-nav";

export default function MarketingLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className="w-screen h-screen flex overflow-x-hidden">
          <div className="w-full">
            <div className="h-full p-5 bg-stone-100">
                <HomeNav />
                {children}
            </div>
          </div>
        </div>
    )
  }