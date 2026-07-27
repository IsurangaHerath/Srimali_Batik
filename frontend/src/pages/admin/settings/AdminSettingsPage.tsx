import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { Save } from 'lucide-react'

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<Record<string, string>>({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data.data),
  })

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {}
      ;(settings as any[]).forEach((s: any) => { map[s.key] = s.value })
      setValues(map)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => api.put(`/admin/settings/${id}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast({ title: 'Setting updated', variant: 'success' })
    },
  })

  const handleSave = (setting: any) => {
    updateMutation.mutate({ id: setting.id, value: values[setting.key] || '' })
  }

  const settingLabels: Record<string, string> = {
    whatsapp_number: 'WhatsApp Number',
    store_name: 'Store Name',
    store_email: 'Store Email',
    store_phone: 'Store Phone',
    store_address: 'Store Address',
    store_description: 'Store Description',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-3">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage business information</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {settings?.map((setting: any) => (
            <Card key={setting.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{settingLabels[setting.key] || setting.key}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={values[setting.key] || ''}
                    onChange={e => setValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                  />
                  <Button onClick={() => handleSave(setting)} className="gap-2 shrink-0">
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}