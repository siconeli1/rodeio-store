import { Header } from "@/components/store/header"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </>
  )
}
