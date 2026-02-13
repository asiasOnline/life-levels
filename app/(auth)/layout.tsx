
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className="w-screen h-screen flex overflow-x-hidden">
          <div className="w-full">
            <div className="h-full p-5 bg-stone-100">
              {children}
            </div>
          </div>
        </div>
    )
  }