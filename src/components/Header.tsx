import { Link, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import ThemeToggle from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { logoutAction } from '#/server/auth'

export default function Header() {
  const { t } = useTranslation()
  const router = useRouter()

  async function handleLogout() {
    await logoutAction()
    await router.navigate({ to: '/login' })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-screen-lg items-center gap-6 px-4">
        <Link
          to="/studies"
          className="font-semibold text-sm text-foreground no-underline"
        >
          NASA-TLX
        </Link>

        <Link
          to="/studies"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
          activeProps={{ className: 'text-foreground font-medium' }}
        >
          {t('nav.studies')}
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  )
}
