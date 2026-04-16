import { createFileRoute, Outlet } from '@tanstack/react-router'
import { checkAuth } from '#/server/auth'
import Header from '#/components/Header'

export const Route = createFileRoute('/studies')({
  beforeLoad: async () => {
    await checkAuth()
  },
  component: () => (
    <>
      <Header />
      <Outlet />
    </>
  ),
})
