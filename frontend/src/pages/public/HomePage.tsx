import { usePublicSettings } from '@/hooks/use-data'
import { usePatterns } from '@/hooks/use-data'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatternCard } from '@/components/public/PatternCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomePage() {
  const { data: patterns, isLoading } = usePatterns()
  const { data: settings } = usePublicSettings()

  const whatsapp = settings?.find(s => s.key === 'whatsapp_number')?.value
  const storeDesc = settings?.find(s => s.key === 'store_description')?.value

  return (
    <div>
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-b from-primary-light/30 to-background">
        <div className="container-custom py-20 md:py-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Star className="h-3.5 w-3.5" />
                Handcrafted Since 1990
              </span>
              <h1 className="heading-1 mb-6">
                Authentic Sri Lankan{' '}
                <span className="text-primary">Batik</span>
              </h1>
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-8 leading-relaxed">
                {storeDesc || 'Discover our collection of handcrafted batik clothing and fabrics. Each piece is uniquely designed and hand-dyed by skilled artisans.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/patterns">
                  <Button size="lg" className="gap-2">
                    Explore Patterns
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="lg">
                      Contact on WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <h2 className="heading-2 mb-2">Featured Patterns</h2>
              <p className="text-text-secondary">Explore our latest batik designs</p>
            </div>
            <Link to="/patterns" className="hidden md:flex items-center gap-1 text-primary text-sm font-medium hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : patterns?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {patterns.slice(0, 6).map((pattern, i) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <PatternCard pattern={pattern} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-secondary">
              <p>No patterns available yet. Check back soon!</p>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link to="/patterns">
              <Button variant="outline" className="gap-2">
                View All Patterns <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="heading-2 mb-6">Our Story</h2>
            <p className="text-text-secondary leading-relaxed text-lg">
              For over three decades, Srimali Batik has been creating exquisite handcrafted batik pieces 
              that blend traditional Sri Lankan artistry with contemporary design. Each piece tells a story 
              of skilled craftsmanship, vibrant colors, and cultural heritage.
            </p>
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div>
                <div className="text-3xl font-display font-bold text-primary">30+</div>
                <div className="text-sm text-text-secondary mt-1">Years of Craftsmanship</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-primary">100+</div>
                <div className="text-sm text-text-secondary mt-1">Unique Designs</div>
              </div>
              <div>
                <div className="text-3xl font-display font-bold text-primary">100%</div>
                <div className="text-sm text-text-secondary mt-1">Handcrafted</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {whatsapp && (
        <section className="py-16 md:py-24">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-hover p-8 md:p-16 text-center text-primary-foreground"
            >
              <h2 className="heading-2 mb-4">Ready to Order?</h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                Contact us on WhatsApp to place your order or inquire about custom designs.
              </p>
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="secondary" className="gap-2">
                  Order via WhatsApp
                </Button>
              </a>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}