import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Expand } from 'lucide-react'
import type { Pattern } from '@/hooks/use-data'
import Lightbox from './Lightbox'
import { useState } from 'react'

interface PatternCardProps {
  pattern: Pattern
}

export function PatternCard({ pattern }: PatternCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      <div className="group block">
        <div
          className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-4 cursor-pointer"
          onClick={() => pattern.imageUrl && setLightboxOpen(true)}
        >
          {pattern.imageUrl ? (
            <img
              src={pattern.imageUrl}
              alt={pattern.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted">
              <span className="font-display text-lg">{pattern.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          {pattern.imageUrl && (
            <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Expand className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <Link to={`/patterns/${pattern.slug}`} className="block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">
                {pattern.name}
              </h3>
              {pattern.category && (
                <p className="text-sm text-text-secondary mt-0.5">{pattern.category.name}</p>
              )}
            </div>
            {pattern.colors?.length > 0 && (
              <div className="flex -space-x-1.5 shrink-0">
                {pattern.colors.slice(0, 4).map((pc) => (
                  <div
                    key={pc.color.id}
                    className="w-5 h-5 rounded-full border-2 border-card"
                    style={{ backgroundColor: pc.color.hex }}
                    title={pc.color.name}
                  />
                ))}
              </div>
            )}
          </div>
          {pattern.products?.length > 0 && (
            <p className="text-xs text-text-muted mt-2">
              {pattern.products.length} product{pattern.products.length > 1 ? 's' : ''}
            </p>
          )}
        </Link>
      </div>
      <Lightbox
        src={pattern.imageUrl || ''}
        alt={pattern.name}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}