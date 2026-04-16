'use server'
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server'

export function checkBasicAuth(): void {
  const username = process.env.AUTH_USERNAME
  const password = process.env.AUTH_PASSWORD
  if (!username || !password) return // bypass in dev if env vars not set

  const header = getRequestHeader('authorization')
  if (!header?.startsWith('Basic ')) {
    setResponseHeader('WWW-Authenticate', 'Basic realm="Researcher Portal"')
    setResponseStatus(401)
    throw new Response('Unauthorized', { status: 401 })
  }
  const [user, pass] = Buffer.from(header.slice(6), 'base64').toString().split(':')
  if (user !== username || pass !== password) {
    setResponseHeader('WWW-Authenticate', 'Basic realm="Researcher Portal"')
    setResponseStatus(401)
    throw new Response('Unauthorized', { status: 401 })
  }
}
