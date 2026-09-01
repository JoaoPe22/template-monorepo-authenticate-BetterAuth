import Image from 'next/image'
import Link from 'next/link'

import { SidebarHeader } from '@/components/ui/sidebar'

const AppSidebarHeader = () => {
  return (
    <SidebarHeader>
      <Link href="/">
        <Image src="/logo.png" alt="Template Monorepo Authenticate" priority width={250} height={50} />
      </Link>
    </SidebarHeader>
  )
}

export { AppSidebarHeader }
