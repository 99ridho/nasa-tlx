import { createFileRoute, redirect } from '@tanstack/react-router'
import { checkBasicAuth } from '#/lib/auth'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    checkBasicAuth()
    throw redirect({ to: '/studies' })
  },
})
