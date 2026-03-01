import { cn } from '@/lib/utils'

export function Button({ className, variant = 'default', disabled, children, ...props }) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-4 py-2 text-sm'

  const variants = {
    default: 'bg-slate-800 text-white hover:bg-slate-700',
    outline: 'border border-gray-300 bg-white text-slate-800 hover:bg-gray-50',
  }

  return (
    <button
      className={cn(base, variants[variant] ?? variants.default, className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
