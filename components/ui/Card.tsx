interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 ${className}`}>
      {children}
    </div>
  )
}









