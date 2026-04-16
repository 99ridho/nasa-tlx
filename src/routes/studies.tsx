import { createFileRoute, Outlet } from '@tanstack/react-router'
import { checkBasicAuth } from '#/lib/auth'
import Header from '#/components/Header'

export const Route = createFileRoute('/studies')({
  beforeLoad: () => {
    checkBasicAuth()
  },
  component: () => (
    <>
      <Header />
      <Outlet />
    </>
  ),
})
