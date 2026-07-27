import { useParams, Link } from 'react-router-dom'
import { usePattern } from '@/hooks/use-data'
import { usePublicSettings } from '@/hooks/use-data'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Expand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { buildWhatsAppUrl } from '@/lib/utils'
import { useState } from 'react'
import Lightbox from '@/components/public/Lightbox'

export default function PatternDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: pattern, isLoading } = usePattern(slug || '')
  const { data: settings } = usePublicSettings()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  const whatsapp = settings?.find(s => s.key === 'whatsapp_number')?.value

  if (isLoading) {
    return (
      <div className="container-custom py-12 md:py-16">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-48 mt-6" />
          </div>
        </div>
      </div>
    )
  }

  if (!pattern) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="heading-3 mb-4">Pattern Not Found</h2>
        <Link to="/patterns">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Patterns
          </Button>
        </Link>
      </div>
    )
  }

  const orderMessage = `Hi, I'm interested in the "${pattern.name}" pattern.`

  return (
    <div className="container-custom py-12 md:py-16">
      <Link
        to="/patterns"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Patterns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted group cursor-pointer"
            onClick={() => pattern.imageUrl && setLightbox({ src: pattern.imageUrl, alt: pattern.name })}
          >
            {pattern.imageUrl ? (
              <img
                src={pattern.imageUrl}
                alt={pattern.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted font-display text-4xl">
                {pattern.name.charAt(0)}
              </div>
            )}
            {pattern.imageUrl && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="p-2 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Expand className="h-5 w-5" />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-start gap-3 flex-wrap mb-3">
            {pattern.category && (
              <Badge variant="secondary">{pattern.category.name}</Badge>
            )}
            <Badge variant="outline">{pattern.products?.length || 0} products</Badge>
          </div>

          <h1 className="heading-2 mb-4">{pattern.name}</h1>

          {pattern.description && (
            <p className="text-text-secondary leading-relaxed mb-6">
              {pattern.description}
            </p>
          )}

          {pattern.colors?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium mb-3">Available Colors</h3>
              <div className="flex flex-wrap gap-3">
                {pattern.colors.map((pc) => (
                  <button
                    key={pc.color.id}
                    onClick={() => setSelectedColor(pc.color.name)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === pc.color.name
                        ? 'border-primary scale-110 shadow-md'
                        : 'border-border hover:scale-105'
                    }`}
                    style={{ backgroundColor: pc.color.hex }}
                    title={pc.color.name}
                  />
                ))}
              </div>
              {selectedColor && (
                <p className="text-xs text-text-secondary mt-2">
                  Selected: <span className="font-medium">{selectedColor}</span>
                </p>
              )}
            </div>
          )}

          {whatsapp && (
            <a
              href={buildWhatsAppUrl(whatsapp, orderMessage)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <ShoppingBag className="h-4 w-4" />
                Order via WhatsApp
              </Button>
            </a>
          )}
        </motion.div>
      </div>

      {pattern.products?.length > 0 && (
        <section className="mt-16">
          <h2 className="heading-3 mb-8">Available Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pattern.products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="group rounded-xl border border-border bg-card overflow-hidden card-hover">
                  <div
                    className="relative aspect-[4/3] bg-muted overflow-hidden group cursor-pointer"
                    onClick={() => product.imageUrl && setLightbox({ src: product.imageUrl, alt: product.name })}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted font-display text-2xl">
                        {product.name.charAt(0)}
                      </div>
                    )}
                    {product.imageUrl && (
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Expand className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.type && (
                          <p className="text-xs text-text-secondary mt-0.5">{product.type}</p>
                        )}
                      </div>
                      {product.price && (
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          {product.price}
                        </span>
                      )}
                    </div>
                    {product.colors?.length > 0 && (
                      <div className="flex gap-1.5 mt-3">
                        {product.colors.map((pc) => (
                          <div
                            key={pc.color.id}
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: pc.color.hex }}
                            title={pc.color.name}
                          />
                        ))}
                      </div>
                    )}
                    {whatsapp && (
                      <a
                        href={buildWhatsAppUrl(whatsapp, `Hi, I'm interested in the "${product.name}" (${pattern.name})${selectedColor ? ` in ${selectedColor}` : ''}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block"
                      >
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Order Now
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      <Lightbox
        src={lightbox?.src || ''}
        alt={lightbox?.alt || ''}
        open={!!lightbox}
        onClose={() => setLightbox(null)}
      />
    </div>
  )
}