import { SecurityLevel } from '@prisma/client'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { UseFormReturn } from 'react-hook-form'
import { CreateExamRequest } from '@/types/exam'

interface ExamSecuritySettingsProps {
  form: UseFormReturn<CreateExamRequest>
}

export function ExamSecuritySettings({ form }: ExamSecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure security settings for this exam to prevent cheating and ensure academic integrity.
        </p>
      </div>

      <Separator />

      <FormField
        control={form.control}
        name="securityLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Security Level</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select security level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={SecurityLevel.MINIMAL}>Minimal</SelectItem>
                <SelectItem value={SecurityLevel.STANDARD}>Standard</SelectItem>
                <SelectItem value={SecurityLevel.STRICT}>Strict</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Choose the overall security level for this exam. This will pre-configure recommended settings.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maxViolations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Violations</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Number of security violations allowed before the exam is automatically locked.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Security Features</h4>

        <FormField
          control={form.control}
          name="fullScreenMode"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Full Screen Mode</FormLabel>
                <FormDescription>
                  Require students to take the exam in full-screen mode
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blockMultipleTabs"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Block Multiple Tabs</FormLabel>
                <FormDescription>
                  Prevent students from opening other browser tabs
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blockKeyboardShortcuts"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Block Keyboard Shortcuts</FormLabel>
                <FormDescription>
                  Disable common keyboard shortcuts during the exam
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blockClipboard"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Block Clipboard</FormLabel>
                <FormDescription>
                  Prevent copy and paste operations
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="browserMonitoring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Browser Monitoring</FormLabel>
                <FormDescription>
                  Monitor browser activity during the exam
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blockSearchEngines"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Block Search Engines</FormLabel>
                <FormDescription>
                  Prevent access to search engines during the exam
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="webcamRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Webcam Required</FormLabel>
                <FormDescription>
                  Require webcam monitoring during the exam
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deviceTracking"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Device Tracking</FormLabel>
                <FormDescription>
                  Track and prevent multiple device usage
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="screenshotBlocking"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Screenshot Blocking</FormLabel>
                <FormDescription>
                  Prevent taking screenshots during the exam
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="periodicUserValidation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Periodic User Validation</FormLabel>
                <FormDescription>
                  Periodically verify user identity during the exam
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
