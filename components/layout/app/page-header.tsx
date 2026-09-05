import React from 'react'

interface PageHeaderProps {
    icon: React.ComponentType<{ className?: string }>
    iconSize?: string;
    title: string;
    subtitle?: string;
}

const PageHeader = ({icon: Icon, iconSize, title, subtitle}: PageHeaderProps) => {
  return (
    <div className="page-header mb-6">
      <div className='flex place-items-center items-center gap-2'>
        <Icon className={iconSize}/>
        <h1 className="text-2xl font-semibold align-middle">{title}</h1>
      </div>
      <p className="w-200 text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export default PageHeader