import { useActivity } from '@/hooks/use-data'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

const actionColors: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
  LOGIN: 'default',
  LOGOUT: 'default',
}

export default function AdminActivityPage() {
  const { data: activities, isLoading } = useActivity()

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-3">Activity Log</h1>
        <p className="text-text-secondary text-sm mt-1">Track all changes made in the admin panel</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities?.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Badge variant={actionColors[a.action] || 'default'}>{a.action}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{a.entity}</TableCell>
                  <TableCell className="text-text-secondary">{a.detail || <span className="text-text-muted">—</span>}</TableCell>
                  <TableCell className="text-sm text-text-secondary">{formatDateTime(a.createdAt)}</TableCell>
                </TableRow>
              ))}
              {(!activities || activities.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-text-secondary">No activity recorded yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}