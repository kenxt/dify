import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/app/components/base/button'
import Toast from '@/app/components/base/toast'
import { emailRegex } from '@/config'
import { login } from '@/service/common'
import Input from '@/app/components/base/input'

type MailAndPasswordAuthProps = {
  isInvite: boolean
}

export default function MailAndPasswordAuth({ isInvite }: MailAndPasswordAuthProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const emailFromLink = decodeURIComponent(searchParams.get('email') || '')
  const [email, setEmail] = useState(emailFromLink)
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const handleEmailPasswordLogin = async () => {
    if (!email) {
      Toast.notify({ type: 'error', message: t('login.error.emailEmpty') })
      return
    }
    if (!emailRegex.test(email)) {
      Toast.notify({
        type: 'error',
        message: t('login.error.emailInValid'),
      })
      return
    }
    try {
      setIsLoading(true)
      const loginData: Record<string, any> = {
        email,
        password,
        remember_me: true,
      }
      if (isInvite)
        loginData.invite_token = decodeURIComponent(searchParams.get('invite_token') as string)
      const res = await login({
        url: '/login',
        body: loginData,
      })
      if (res.result === 'success') {
        if (isInvite) {
          router.replace(`/signin/invite-settings?${searchParams.toString()}`)
        }
        else {
          localStorage.setItem('console_token', res.data.access_token)
          localStorage.setItem('refresh_token', res.data.refresh_token)
          router.replace('/apps')
        }
      }
      else if (res.message === 'account_not_found') {
        const params = new URLSearchParams()
        params.append('email', encodeURIComponent(email))
        params.append('token', encodeURIComponent(res.data))
        router.replace(`/reset-password/check-code?${params.toString()}`)
      }
      else {
        Toast.notify({
          type: 'error',
          message: res.data,
        })
      }
    }

    finally {
      setIsLoading(false)
    }
  }

  return <form onSubmit={() => { }}>
    <div className='mb-3'>
      <label htmlFor="email" className="my-2 system-md-semibold text-text-secondary">
        {t('login.email')}
      </label>
      <div className="mt-1">
        <Input
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isInvite}
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('login.emailPlaceholder') || ''}
          tabIndex={1}
        />
      </div>
    </div>

    <div className='mb-3'>
      <label htmlFor="password" className="my-2 flex items-center justify-between">
        <span className='system-md-semibold text-text-secondary'>{t('login.password')}</span>
        <Link href={`/reset-password?${searchParams.toString()}`} className='system-xs-regular text-components-button-secondary-accent-text'>
          {t('login.forget')}
        </Link>
      </label>
      <div className="relative mt-1">
        <Input
          id="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              handleEmailPasswordLogin()
          }}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder') || ''}
          tabIndex={2}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button
            type="button"
            variant='ghost'
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👀' : '😝'}
          </Button>
        </div>
      </div>
    </div>

    <div className='mb-2'>
      <Button
        tabIndex={2}
        variant='primary'
        onClick={handleEmailPasswordLogin}
        disabled={isLoading || !email || !password}
        className="w-full"
      >{t('login.signBtn')}</Button>
    </div>
  </form>
}