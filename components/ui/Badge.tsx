type BadgeVariant = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant: BadgeVariant
}

const variantStyles = {
  green: 'bg-green-500/20 text-green-500',
  yellow: 'bg-yellow-500/20 text-yellow-500',
  red: 'bg-red-500/20 text-red-500',
  blue: 'bg-blue-500/20 text-blue-500',
  gray: 'bg-gray-500/20 text-gray-400'
}

export function Badge({ children, variant }: BadgeProps) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${variantStyles[variant]}`}>
      {children}
    </span>
  )
}









