'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { authClient } from '@/auth/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
} from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'

const redefinirSenhaSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'A confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type RedefinirSenhaFormData = z.infer<typeof redefinirSenhaSchema>

const RedefinirSenhaForm = () => {
  const router = useRouter()
  const token = useSearchParams().get('token')
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<RedefinirSenhaFormData>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const handleRedefinirSenha = async (data: RedefinirSenhaFormData) => {
    if (!token) return

    try {
      const response = await authClient.resetPassword({
        newPassword: data.password,
        token,
      })

      if (response.error) {
        toast.error(
          response.error.message ||
            'Não foi possível redefinir a senha. Solicite um novo link.',
        )
        return
      }

      toast.success('Senha redefinida com sucesso! Faça login novamente.')
      router.push('/sign-in')
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      toast.error('Erro ao redefinir a senha. Tente novamente.')
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Redefinir senha</CardTitle>
      </CardHeader>

      <CardContent>
        {token ? (
          <form onSubmit={handleSubmit(handleRedefinirSenha)} method="post">
            <FieldGroup>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Nova senha</FieldLabel>
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
                <FieldLabel htmlFor="confirmPassword">
                  Confirmar nova senha
                </FieldLabel>
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
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Spinner />}
                  Redefinir senha
                </Button>
              </Field>
            </FieldGroup>
          </form>
        ) : (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Link inválido</AlertTitle>
            <AlertDescription>
              Este link de redefinição é inválido ou expirou.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href={token ? '/sign-in' : '/esqueci-a-senha'} prefetch={false}>
            {token ? 'Voltar para o login' : 'Solicitar um novo link'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export { RedefinirSenhaForm }
