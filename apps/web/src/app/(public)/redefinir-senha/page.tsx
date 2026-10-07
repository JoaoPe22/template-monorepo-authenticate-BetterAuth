import { Suspense } from 'react'

import { RedefinirSenhaForm } from './_components/redefinir-senha-form'

// useSearchParams (lido no form) exige um Suspense acima dele
const Page = () => {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  )
}

export default Page
