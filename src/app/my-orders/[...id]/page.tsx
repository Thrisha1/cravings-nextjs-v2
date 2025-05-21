import React from 'react'
import { PageProps } from '../../../../.next/types/app/(root)/page';


async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <div>
      order detail page {id}
    </div>
  )
}

export default Page
