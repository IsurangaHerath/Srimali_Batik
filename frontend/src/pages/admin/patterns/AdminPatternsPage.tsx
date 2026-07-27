import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useCategories, useColors } from '@/hooks/use-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ImageUpload from '@/components/admin/ImageUpload'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface FormData {
  name: string
  description: string
  imageUrl: string
  categoryId: string
  colorIds: string[]
}

const emptyForm: FormData = { name: '', description: '', imageUrl: '', categoryId: '', colorIds: [] }

export default function AdminPatternsPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['admin-patterns'],
    queryFn: () => api.get('/admin/patterns').then(r => r.data.data),
  })

  const { data: categories } = useCategories()
  const { data: colors } = useColors()

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/patterns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patterns'] })
      queryClient.invalidateQueries({ queryKey: ['patterns'] })
      toast({ title: 'Pattern created', variant: 'success' })
      setOpen(false)
      setForm(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.put(`/admin/patterns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patterns'] })
      queryClient.invalidateQueries({ queryKey: ['patterns'] })
      toast({ title: 'Pattern updated', variant: 'success' })
      setOpen(false)
      setEditing(null)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/patterns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patterns'] })
      queryClient.invalidateQueries({ queryKey: ['patterns'] })
      toast({ title: 'Pattern deleted', variant: 'success' })
      setDeleteId(null)
    },
  })

  const openEdit = (pattern: any) => {
    setEditing(pattern.id)
    setForm({
      name: pattern.name,
      description: pattern.description || '',
      imageUrl: pattern.imageUrl || '',
      categoryId: pattern.categoryId || '',
      colorIds: pattern.colors?.map((c: any) => c.colorId) || [],
    })
    setOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) {
      toast({ title: 'Name is required', variant: 'destructive' })
      return
    }
    if (editing) {
      updateMutation.mutate({ id: editing, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const toggleColor = (colorId: string) => {
    setForm(prev => ({
      ...prev,
      colorIds: prev.colorIds.includes(colorId)
        ? prev.colorIds.filter(id => id !== colorId)
        : [...prev.colorIds, colorId],
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-3">Patterns</h1>
          <p className="text-text-secondary text-sm mt-1">Manage batik patterns</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Pattern
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Pattern' : 'Create Pattern'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm(p => ({ ...p, imageUrl: url }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={form.categoryId}
                onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No category</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            {colors && (
              <div className="space-y-2">
                <Label>Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => toggleColor(color.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.colorIds.includes(color.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface border-border text-text-secondary hover:border-primary'
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pattern?</AlertDialogTitle>
            <AlertDialogDescription>This will also delete all products under this pattern. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patterns?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-text-muted">{p.name.charAt(0)}</div>
                      )}
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <p className="text-xs text-text-secondary">{p._count?.products || 0} products</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{p.category?.name || <span className="text-text-muted">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.colors?.slice(0, 5).map((pc: any) => (
                        <div key={pc.color.id} className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: pc.color.hex }} title={pc.color.name} />
                      ))}
                      {p.colors?.length > 5 && <span className="text-xs text-text-muted">+{p.colors.length - 5}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-accent" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!patterns || patterns.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-text-secondary">No patterns yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}