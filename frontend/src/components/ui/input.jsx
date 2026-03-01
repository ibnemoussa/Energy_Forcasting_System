import { cn } from '@/lib/utils'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400',
        className
      )}
      {...props}
    />
  )
}
