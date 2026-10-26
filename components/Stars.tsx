// taskers/components/Stars.tsx
import { Star } from 'lucide-react'

export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value)
  return (
    <span className="inline-flex" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} aria-hidden className={i <= full ? 'fill-marigold text-marigold' : 'text-line'} />
      ))}
    </span>
  )
}
