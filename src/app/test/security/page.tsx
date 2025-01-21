'use client'

import { useState, useEffect } from 'react'
import { useExamSecurity } from '@/hooks/use-exam-security'
import { WebcamMonitor } from '@/components/security/webcam-monitor'
import { SecurityMonitor } from '@/components/security/security-monitor'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ViolationType } from '@prisma/client'
import { useSecurityStore } from '@/hooks/use-exam-security'
import type { SecurityState, SecurityViolation } from '@/hooks/use-exam-security'

const TEST_EXAM_ID = 'test-exam-123'
const MAX_VIOLATIONS = 5

export default function SecurityTestPage() {
  const [violations, setViolations] = useState<Map<ViolationType, number>>(new Map())
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [webcamActive, setWebcamActive] = useState(false)

  const security = useExamSecurity({
    examId: TEST_EXAM_ID,
    maxViolations: MAX_VIOLATIONS,
    fullScreenMode: true,
    blockMultipleTabs: true,
    blockKeyboardShortcuts: true,
    blockRightClick: true,
    blockClipboard: true,
    browserMonitoring: true,
    blockSearchEngines: true,
    deviceTracking: true,
    screenshotBlocking: true,
    periodicUserValidation: true,
    webcamRequired: true,
    resumeCount: 3
  })

  const securityStore = useSecurityStore()

  useEffect(() => {
    const unsubscribe = securityStore.subscribe((state: SecurityState) => {
      // Only update if we have new violations
      const currentViolationsCount = Array.from(violations.values()).reduce((a, b) => a + b, 0)
      if (state.violations.length > currentViolationsCount) {
        // Get new violations
        const newViolations = state.violations.slice(currentViolationsCount)
        
        // Update violation counts
        setViolations(prev => {
          const newMap = new Map(prev)
          for (const violation of newViolations) {
            const currentCount = prev.get(violation.type) || 0
            newMap.set(violation.type, currentCount + 1)
          }
          return newMap
        })
      }

      // Update UI states
      setIsFullScreen(state.isFullScreen)
      setWebcamActive(state.webcamActive)
    })

    return () => unsubscribe()
  }, [violations])

  const testControls = [
    {
      title: 'Clipboard Controls',
      actions: [
        {
          name: 'Test Copy',
          action: () => {
            try {
              document.execCommand('copy')
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.CLIPBOARD_USAGE,
                timestamp: new Date(),
                details: { action: 'copy' }
              })
            } catch (e) {
              console.log('Copy blocked')
            }
          }
        },
        {
          name: 'Test Paste',
          action: () => {
            try {
              document.execCommand('paste')
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.CLIPBOARD_USAGE,
                timestamp: new Date(),
                details: { action: 'paste' }
              })
            } catch (e) {
              console.log('Paste blocked')
            }
          }
        }
      ]
    },
    {
      title: 'Keyboard Controls',
      actions: [
        {
          name: 'Test Alt+Tab',
          action: () => {
            const event = new KeyboardEvent('keydown', {
              key: 'Tab',
              altKey: true
            })
            document.dispatchEvent(event)
            securityStore.incrementViolation({
              id: crypto.randomUUID(),
              examId: TEST_EXAM_ID,
              type: ViolationType.KEYBOARD_SHORTCUT,
              timestamp: new Date(),
              details: { key: 'Alt+Tab' }
            })
          }
        },
        {
          name: 'Test Ctrl+C',
          action: () => {
            const event = new KeyboardEvent('keydown', {
              key: 'c',
              ctrlKey: true
            })
            document.dispatchEvent(event)
            securityStore.incrementViolation({
              id: crypto.randomUUID(),
              examId: TEST_EXAM_ID,
              type: ViolationType.KEYBOARD_SHORTCUT,
              timestamp: new Date(),
              details: { key: 'Ctrl+C' }
            })
          }
        }
      ]
    },
    {
      title: 'Screen Controls',
      actions: [
        {
          name: 'Toggle Full Screen',
          action: async () => {
            try {
              if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
                securityStore.setFullScreen(true)
              } else {
                await document.exitFullscreen()
                securityStore.setFullScreen(false)
                securityStore.incrementViolation({
                  id: crypto.randomUUID(),
                  examId: TEST_EXAM_ID,
                  type: ViolationType.FULL_SCREEN_EXIT,
                  timestamp: new Date(),
                  details: { action: 'exit_fullscreen' }
                })
              }
            } catch (e) {
              console.error('Fullscreen toggle failed:', e)
            }
          }
        },
        {
          name: 'Test Screenshot',
          action: () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.toDataURL()
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.SCREENSHOT_ATTEMPT,
                timestamp: new Date(),
                details: { method: 'canvas' }
              })
            } catch (e) {
              console.log('Screenshot blocked')
            }
          }
        }
      ]
    },
    {
      title: 'Network Security',
      actions: [
        {
          name: 'Test VPN Detection',
          action: async () => {
            try {
              const rtcPeerConnection = new RTCPeerConnection()
              rtcPeerConnection.createDataChannel('')
              await rtcPeerConnection.createOffer()
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.AUTOMATION_DETECTED,
                timestamp: new Date(),
                details: { method: 'webrtc' }
              })
            } catch (e) {
              console.log('WebRTC blocked')
            }
          }
        },
        {
          name: 'Test Search Engine',
          action: () => {
            window.open('https://google.com', '_blank')
            securityStore.incrementViolation({
              id: crypto.randomUUID(),
              examId: TEST_EXAM_ID,
              type: ViolationType.BROWSER_EXTENSION_DETECTED,
              timestamp: new Date(),
              details: { url: 'https://google.com' }
            })
          }
        },
        {
          name: 'Test Multiple Tabs',
          action: () => {
            window.open(window.location.href, '_blank')
            securityStore.incrementViolation({
              id: crypto.randomUUID(),
              examId: TEST_EXAM_ID,
              type: ViolationType.TAB_SWITCH,
              timestamp: new Date(),
              details: { url: window.location.href }
            })
          }
        }
      ]
    },
    {
      title: 'Device Security',
      actions: [
        {
          name: 'Test Hardware Info',
          action: async () => {
            try {
              const gpu = await (navigator as any).gpu?.requestAdapter()
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.VIRTUAL_MACHINE_DETECTED,
                timestamp: new Date(),
                details: { gpu }
              })
            } catch (e) {
              console.log('Hardware info blocked')
            }
          }
        },
        {
          name: 'Test Audio Fingerprint',
          action: () => {
            try {
              const audioContext = new AudioContext()
              const oscillator = audioContext.createOscillator()
              oscillator.connect(audioContext.destination)
              oscillator.start()
              setTimeout(() => oscillator.stop(), 100)
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.API_TAMPERING,
                timestamp: new Date(),
                details: { method: 'oscillator' }
              })
            } catch (e) {
              console.log('Audio blocked')
            }
          }
        }
      ]
    },
    {
      title: 'User Validation',
      actions: [
        {
          name: 'Toggle Webcam',
          action: async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true })
              stream.getTracks().forEach(track => track.stop())
              securityStore.setWebcamActive(false)
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.WEBCAM_VIOLATION,
                timestamp: new Date(),
                details: { action: 'webcam_stopped' }
              })
            } catch (e) {
              console.log('Webcam access failed')
            }
          }
        },
        {
          name: 'Simulate Absence',
          action: () => {
            document.dispatchEvent(new Event('visibilitychange'))
            securityStore.incrementViolation({
              id: crypto.randomUUID(),
              examId: TEST_EXAM_ID,
              type: ViolationType.INACTIVITY,
              timestamp: new Date(),
              details: { action: 'tab_hidden' }
            })
          }
        },
        {
          name: 'Test Periodic Check',
          action: () => {
            securityStore.setValidationStatus('validating')
            setTimeout(() => {
              securityStore.setValidationStatus('failed')
              securityStore.incrementViolation({
                id: crypto.randomUUID(),
                examId: TEST_EXAM_ID,
                type: ViolationType.PERIODIC_CHECK_FAILED,
                timestamp: new Date(),
                details: { reason: 'periodic_check_failed' }
              })
            }, 2000)
          }
        }
      ]
    }
  ]

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Security Features Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
          </CardHeader>
          <CardContent>
            <SecurityMonitor 
              examId={TEST_EXAM_ID}
              maxViolations={MAX_VIOLATIONS}
              fullScreenMode={true}
              blockMultipleTabs={true}
              screenshotBlocking={true}
              browserMonitoring={true}
              webcamRequired={true}
            />
            <Separator className="my-4" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Full Screen:</span>
                <Badge variant={isFullScreen ? "default" : "destructive"}>
                  {isFullScreen ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Webcam:</span>
                <Badge variant={webcamActive ? "default" : "destructive"}>
                  {webcamActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webcam Monitor */}
        <Card>
          <CardHeader>
            <CardTitle>Webcam Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <WebcamMonitor 
              examId={TEST_EXAM_ID}
              required={true}
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testControls.map((control) => (
          <Card key={control.title}>
            <CardHeader>
              <CardTitle>{control.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {control.actions.map((action) => (
                  <Button
                    key={action.name}
                    onClick={action.action}
                    className="w-full"
                  >
                    {action.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Violations Log */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Security Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from(violations.entries()).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span>{type}:</span>
                <Badge variant="destructive">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
