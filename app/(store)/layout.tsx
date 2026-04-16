import { Header } from "@/components/store/header"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
