import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-3xl border bg-white shadow-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}
