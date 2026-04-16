'use server'
import { createServerFn } from '@tanstack/react-start'
import {
  getCookie,
  setCookie,
  deleteCookie,
} from '@tanstack/react-start/server'
import { SignJWT, jwtVerify } from 'jose'
import { redirect } from '@tanstack/react-router'

const COOKIE_NAME = 'auth_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 86400,
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-not-for-production'
  return new TextEncoder().encode(secret)
}

export const loginAction = createServerFn({ method: 'POST' })
  .inputValidator((d: { username: string; password: string }) => d)
  .handler(async ({ data }) => {
    const username = process.env.AUTH_USERNAME
    const password = process.env.AUTH_PASSWORD

    if (!username || !password) {
      // Dev bypass: no credentials configured, sign token for any input
      const token = await new SignJWT({ sub: data.username })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(getSecret())
      setCookie(COOKIE_NAME, token, COOKIE_OPTIONS)
      return
    }

    if (data.username !== username || data.password !== password) {
      throw new Error('Invalid credentials')
    }

    const token = await new SignJWT({ sub: username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(getSecret())

    setCookie(COOKIE_NAME, token, COOKIE_OPTIONS)
  })

export const checkAuth = createServerFn().handler(async () => {
  const username = process.env.AUTH_USERNAME
  const password = process.env.AUTH_PASSWORD
  if (!username || !password) return // dev bypass

  const token = getCookie(COOKIE_NAME)
  if (!token) {
    throw redirect({ to: '/login' })
  }

  try {
    await jwtVerify(token, getSecret())
  } catch {
    throw redirect({ to: '/login' })
  }
})

export const getAuthStatus = createServerFn().handler(
  async (): Promise<boolean> => {
    const username = process.env.AUTH_USERNAME
    const password = process.env.AUTH_PASSWORD
    if (!username || !password) return true // dev bypass

    const token = getCookie(COOKIE_NAME)
    if (!token) return false

    try {
      await jwtVerify(token, getSecret())
      return true
    } catch {
      return false
    }
  },
)

export const logoutAction = createServerFn({ method: 'POST' }).handler(
  async () => {
    deleteCookie(COOKIE_NAME)
  },
)
