import { createFileRoute, redirect } from '@tanstack/react-router'
import { checkAuth } from '#/server/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    await checkAuth()
    throw redirect({ to: '/studies' })
  },
})
