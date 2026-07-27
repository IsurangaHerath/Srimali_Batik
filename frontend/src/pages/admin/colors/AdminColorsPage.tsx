import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface FormData {
  name: string
  hex: string
  darkHex: string
  imageUrl: string
}

const emptyForm: FormData = { name: '', hex: '#000000', darkHex: '', imageUrl: '' }

export default function AdminColorsPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)

  const { data: colors, isLoading } = useQuery({
    queryKey: ['admin-colors'],
    queryFn: () => api.get('/admin/colors').then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/colors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-colors'] })
      queryClient.invalidateQueries({ queryKey: ['colors'] })
      toast({ title: 'Color created', variant: 'success' })
      setOpen(false)
      setForm(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.put(`/admin/colors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-colors'] })
      queryClient.invalidateQueries({ queryKey: ['colors'] })
      toast({ title: 'Color updated', variant: 'success' })
      setOpen(false)
      setEditing(null)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/colors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-colors'] })
      queryClient.invalidateQueries({ queryKey: ['colors'] })
      toast({ title: 'Color deleted', variant: 'success' })
      setDeleteId(null)
    },
  })

  const openEdit = (color: any) => {
    setEditing(color.id)
    setForm({ name: color.name, hex: color.hex, darkHex: color.darkHex || '', imageUrl: color.imageUrl || '' })
    setOpen(true)
  }

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.hex) {
      toast({ title: 'Name and hex color are required', variant: 'destructive' })
      return
    }
    if (editing) updateMutation.mutate({ id: editing, data: form })
    else createMutation.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-3">Colors</h1>
          <p className="text-text-secondary text-sm mt-1">Manage product colors</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Color</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Color' : 'Create Color'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cname">Name *</Label>
              <Input id="cname" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hex">Hex Color *</Label>
                <div className="flex gap-2">
                  <Input id="hex" value={form.hex} onChange={e => setForm(p => ({ ...p, hex: e.target.value }))} />
                  <input type="color" value={form.hex} onChange={e => setForm(p => ({ ...p, hex: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="darkHex">Dark Hex</Label>
                <Input id="darkHex" value={form.darkHex} onChange={e => setForm(p => ({ ...p, darkHex: e.target.value }))} placeholder="#000000" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Color?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Hex</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors?.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: c.hex }} />
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">{c.hex}</code></TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-accent" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!colors || colors.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-text-secondary">No colors yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}