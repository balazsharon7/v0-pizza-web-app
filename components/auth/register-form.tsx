'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface RegisterFormProps {
  locale: Locale
  dictionary: Dictionary
}

export function RegisterForm({ locale, dictionary }: RegisterFormProps) {
  const router = useRouter()
  const t = dictionary
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(locale === 'hu' ? 'A jelszavak nem egyeznek' : 'Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error(locale === 'hu' ? 'A jelszó legalább 6 karakter legyen' : 'Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(t.auth.checkEmail)
      router.push(`/${locale}/auth/login`)
    } catch (error) {
      console.error('Register error:', error)
      toast.error(t.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <span className="font-serif text-lg font-bold text-primary-foreground">TV</span>
        </div>
        <CardTitle className="font-serif text-2xl">{t.auth.registerTitle}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t.auth.fullName}</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{locale === 'hu' ? 'Telefonszám' : 'Phone'}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner className="mr-2" /> : null}
            {t.auth.registerButton}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t.auth.hasAccount}{' '}
            <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
              {t.common.login}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
