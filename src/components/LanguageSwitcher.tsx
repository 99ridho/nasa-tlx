import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui/button'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const otherLang = i18n.language === 'en' ? 'id' : 'en'
  const labels = { en: 'EN', id: 'ID' }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(otherLang)}
      aria-label={`Switch to ${otherLang === 'en' ? 'English' : 'Indonesian'}`}
      className="min-h-[44px] min-w-[44px]"
    >
      {labels[i18n.language as 'en' | 'id'] ?? 'EN'}
    </Button>
  )
}
