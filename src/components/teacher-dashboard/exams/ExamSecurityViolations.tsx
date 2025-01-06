import { SecurityViolation } from '@/types/exam'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ViolationType } from '@prisma/client'

interface ExamSecurityViolationsProps {
  violations: SecurityViolation[]
  maxViolations: number
}

const violationTypeLabels: Record<ViolationType, string> = {
  TAB_SWITCH: 'Tab Switch',
  FULL_SCREEN_EXIT: 'Full Screen Exit',
  KEYBOARD_SHORTCUT: 'Keyboard Shortcut',
  RIGHT_CLICK: 'Right Click',
  CLIPBOARD_USAGE: 'Clipboard Usage',
  SEARCH_ENGINE_DETECTED: 'Search Engine Detected',
  MULTIPLE_DEVICES: 'Multiple Devices',
  WEBCAM_VIOLATION: 'Webcam Violation',
  SCREEN_SHARING: 'Screen Sharing',
  PERIODIC_CHECK_FAILED: 'Periodic Check Failed',
}

const violationTypeSeverity: Record<ViolationType, 'default' | 'secondary' | 'destructive'> = {
  TAB_SWITCH: 'secondary',
  FULL_SCREEN_EXIT: 'secondary',
  KEYBOARD_SHORTCUT: 'default',
  RIGHT_CLICK: 'default',
  CLIPBOARD_USAGE: 'secondary',
  SEARCH_ENGINE_DETECTED: 'destructive',
  MULTIPLE_DEVICES: 'destructive',
  WEBCAM_VIOLATION: 'destructive',
  SCREEN_SHARING: 'destructive',
  PERIODIC_CHECK_FAILED: 'secondary',
}

export function ExamSecurityViolations({ violations, maxViolations }: ExamSecurityViolationsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Security Violations</h3>
          <p className="text-sm text-muted-foreground">
            {violations.length} of {maxViolations} violations recorded
          </p>
        </div>
        {violations.length >= maxViolations && (
          <Badge variant="destructive">Exam Locked</Badge>
        )}
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {violations.map((violation) => (
              <TableRow key={violation.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDistanceToNow(new Date(violation.timestamp), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <Badge variant={violationTypeSeverity[violation.type]}>
                    {violationTypeLabels[violation.type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {violation.details && JSON.stringify(violation.details)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
