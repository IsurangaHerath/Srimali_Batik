import { useDashboardStats } from '@/hooks/use-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Shirt, Package, Palette, Activity, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const statCards = [
  { key: 'totalPatterns', label: 'Patterns', icon: Shirt, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', link: '/admin/patterns' },
  { key: 'totalProducts', label: 'Products', icon: Package, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30', link: '/admin/products' },
  { key: 'totalColors', label: 'Colors', icon: Palette, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', link: '/admin/colors' },
  { key: 'totalCategories', label: 'Categories', icon: Layers, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', link: '/admin/patterns' },
]

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-3">Dashboard</h1>
        <p className="text-text-secondary mt-1">Overview of your store</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Link to={card.link}>
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-text-secondary">{card.label}</p>
                        <p className="text-3xl font-display font-bold mt-1">
                          {stats?.[card.key as keyof typeof stats] ?? 0}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${card.color}`}>
                        <card.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              {stats?.recentActivity ?? 0} activities in the last 7 days
            </p>
            <Link to="/admin/activity" className="text-sm text-primary hover:underline mt-2 inline-block">
              View all activity →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/patterns" className="block text-sm text-primary hover:underline">Add new pattern</Link>
            <Link to="/admin/products" className="block text-sm text-primary hover:underline">Add new product</Link>
            <Link to="/admin/colors" className="block text-sm text-primary hover:underline">Manage colors</Link>
            <Link to="/admin/settings" className="block text-sm text-primary hover:underline">Update settings</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}