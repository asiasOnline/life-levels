import React from 'react'

interface PageHeaderProps {
    title: string;
    subtitle: string;
}

const PageHeader = ({title, subtitle}: PageHeaderProps) => {
  return (
    <div className="page-header mb-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export default PageHeader