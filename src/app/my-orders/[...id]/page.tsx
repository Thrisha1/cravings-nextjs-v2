import React from 'react'
import { Metadata } from 'next'

export function generateMetadata({ params }: { params: { id: string[] } }): Metadata {
  return {
    title: `Order ${params.id.join('/')}`,
  }
}

export default function Page({ params }: { params: { id: string[] } }) {
  const { id } = params;
  return (
    <div>
      order detail page {id}
    </div>
  )
}
