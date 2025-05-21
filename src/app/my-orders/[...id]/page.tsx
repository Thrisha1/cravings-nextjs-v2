import React from 'react'

type Props = {
  params: {
    id: string[]
  }
}

function Page({ params }: Props) {
  const { id } = params;
  return (
    <div>
      order detail page {id}
    </div>
  )
}

export default Page
