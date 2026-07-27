import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface Color {
  id: string
  name: string
  slug: string
  hex: string
  darkHex: string | null
  imageUrl: string | null
}

export interface Pattern {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  categoryId: string | null
  category: Category | null
  colors: { color: Color }[]
  products: Product[]
  createdAt: string
}

export interface Product {
  id: string
  name: string
  slug: string
  type: string | null
  description: string | null
  imageUrl: string | null
  price: string | null
  patternId: string
  colors: { color: Color }[]
}

export interface Setting {
  id: string
  key: string
  value: string
}

export function usePatterns(filters?: { search?: string; category?: string }) {
  const params = new URLSearchParams()
  if (filters?.search) params.set('search', filters.search)
  if (filters?.category) params.set('category', filters.category)

  return useQuery({
    queryKey: ['patterns', filters],
    queryFn: () => api.get<{ success: boolean; data: Pattern[] }>(`/patterns?${params}`).then(r => r.data.data),
  })
}

export function usePattern(slug: string) {
  return useQuery({
    queryKey: ['pattern', slug],
    queryFn: () => api.get<{ success: boolean; data: Pattern }>(`/patterns/${slug}`).then(r => r.data.data),
    enabled: !!slug,
  })
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<{ success: boolean; data: Product[] }>('/products').then(r => r.data.data),
  })
}

export function useColors() {
  return useQuery({
    queryKey: ['colors'],
    queryFn: () => api.get<{ success: boolean; data: Color[] }>('/colors').then(r => r.data.data),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ success: boolean; data: Category[] }>('/categories').then(r => r.data.data),
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ success: boolean; data: Setting[] }>('/settings').then(r => r.data.data),
  })
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get<{ success: boolean; data: Setting[] }>('/settings').then(r => r.data.data),
    staleTime: 1000 * 60 * 10,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<{ success: boolean; data: any }>('/admin/stats').then(r => r.data.data),
  })
}

export function useActivity() {
  return useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => api.get<{ success: boolean; data: any[] }>('/admin/activity').then(r => r.data.data),
  })
}