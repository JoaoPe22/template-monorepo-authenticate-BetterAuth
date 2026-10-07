'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { authClient } from '@/auth/client'
import { GoogleIcon } from '@/components/icons/google-icon'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, 'O nome é obrigatório'),
    email: z
      .email('Formato de e-mail inválido')
      .min(1, 'O e-mail é obrigatório'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'A confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type SignUpFormData = z.infer<typeof signUpSchema>

const Page = () => {
  const router = useRouter()
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const handleSignUp = async (data: SignUpFormData) => {
    try {
      const response = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      })

      if (response.error) {
        toast.error(
          response.error.message || 'Erro ao criar conta. Tente novamente.',
        )
        return
      }

      toast.success(
        'Conta criada! Enviamos um link de confirmação para o seu e-mail.',
      )
      router.push('/sign-in')
    } catch (error) {
      console.error('Erro ao criar conta:', error)
      toast.error('Erro ao criar conta. Tente novamente.')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/' })
    } catch (error) {
      console.error('Erro ao criar conta com Google:', error)
      toast.error('Erro ao criar conta com Google. Tente novamente.')
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Criar conta</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleSignUp)} method="post">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email')}
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register('password')}
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register('confirmPassword')}
                disabled={isSubmitting}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>

            <Field>
              <Button type="submit" variant="secondary" disabled={isSubmitting}>
                {isSubmitting && <Spinner />}
                Criar conta
              </Button>
            </Field>

            <FieldSeparator>ou</FieldSeparator>

            <Field>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <GoogleIcon />
                Continuar com Google
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in" prefetch={false}>
            Já tenho uma conta
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default Page
