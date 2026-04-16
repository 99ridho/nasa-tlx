import { useTranslation } from 'react-i18next'
import { Button } from '#/components/ui/button'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const otherLang = i18n.language === 'en' ? 'id' : 'en'
  const labels = { en: 'EN', id: 'ID' }
  const langName = otherLang === 'en' ? t('language.english') : t('language.indonesian')

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => i18n.changeLanguage(otherLang)}
      aria-label={t('language.switchTo', { lang: langName })}
    >
      {labels[i18n.language as 'en' | 'id'] ?? 'EN'}
    </Button>
  )
}
