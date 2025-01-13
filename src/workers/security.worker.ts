import { ViolationType } from '@prisma/client'

interface SecurityConfig {
  examId: string
  maxViolations: number
  fullScreenMode: boolean
  blockMultipleTabs: boolean
  blockKeyboardShortcuts: boolean
  blockRightClick: boolean
  blockClipboard: boolean
  browserMonitoring: boolean
  blockSearchEngines: boolean
  deviceTracking: boolean
  screenshotBlocking: boolean
  periodicUserValidation: boolean
  webcamRequired: boolean
  resumeCount: number
}

interface SecurityState {
  config: SecurityConfig
  fingerprint: string
  isInitialized: boolean
  lastActiveTime: number
  activeTabId: string
  violations: Map<ViolationType, number>
}

let state: SecurityState = {
  config: {} as SecurityConfig,
  fingerprint: '',
  isInitialized: false,
  lastActiveTime: Date.now(),
  activeTabId: '',
  violations: new Map(),
}

// Event handlers
const handlers = {
  // Keyboard event monitoring
  handleKeyDown: (e: KeyboardEvent) => {
    if (!state.config.blockKeyboardShortcuts) return

    const isShortcut = e.ctrlKey || e.metaKey || e.altKey
    const blockedKeys = ['c', 'v', 'x', 'p', 'r', 'f', 'tab']
    
    if (isShortcut && blockedKeys.includes(e.key.toLowerCase())) {
      e.preventDefault()
      reportViolation(ViolationType.KEYBOARD_SHORTCUT, { key: e.key })
    }
  },

  // Clipboard operations
  handleClipboard: (e: ClipboardEvent) => {
    if (!state.config.blockClipboard) return

    e.preventDefault()
    reportViolation(ViolationType.CLIPBOARD_USAGE, { action: e.type })
  },

  // Tab visibility
  handleVisibility: () => {
    if (!state.config.blockMultipleTabs) return

    if (document.hidden) {
      reportViolation(ViolationType.TAB_SWITCH)
    }
  },

  // Full screen monitoring
  handleFullScreen: () => {
    if (!state.config.fullScreenMode) return

    const isFullScreen = document.fullscreenElement !== null
    if (!isFullScreen) {
      reportViolation(ViolationType.FULL_SCREEN_EXIT)
    }
  },

  // Right click prevention
  handleContextMenu: (e: MouseEvent) => {
    if (!state.config.blockRightClick) return

    e.preventDefault()
    reportViolation(ViolationType.RIGHT_CLICK)
  },
}

// Violation reporting
function reportViolation(type: ViolationType, details?: any) {
  const currentCount = state.violations.get(type) || 0
  state.violations.set(type, currentCount + 1)

  self.postMessage({
    type: 'VIOLATION_DETECTED',
    payload: {
      violationType: type,
      details,
      timestamp: Date.now(),
    },
  })
}

// Screenshot detection
function initScreenshotDetection() {
  if (!state.config.screenshotBlocking) return

  // Monitor screen capture API
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getDisplayMedia = () => {
      reportViolation(ViolationType.SCREENSHOT_ATTEMPT)
      return Promise.reject(new Error('Screen capture is not allowed during exam'))
    }
  }

  // Monitor canvas usage
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
  
  HTMLCanvasElement.prototype.toBlob = function() {
    reportViolation(ViolationType.SCREENSHOT_ATTEMPT)
    return originalToBlob.apply(this, arguments)
  }
  
  HTMLCanvasElement.prototype.toDataURL = function() {
    reportViolation(ViolationType.SCREENSHOT_ATTEMPT)
    return originalToDataURL.apply(this, arguments)
  }
}

// Periodic validation check
function startPeriodicValidation() {
  if (!state.config.periodicUserValidation) return

  setInterval(() => {
    self.postMessage({
      type: 'REQUEST_USER_VALIDATION',
      payload: {
        timestamp: Date.now(),
      },
    })
  }, 15 * 60 * 1000) // Every 15 minutes
}

// Browser activity monitoring
function startActivityMonitoring() {
  if (!state.config.browserMonitoring) return

  setInterval(() => {
    const now = Date.now()
    const inactiveTime = now - state.lastActiveTime

    if (inactiveTime > 5 * 60 * 1000) { // 5 minutes
      reportViolation(ViolationType.INACTIVITY)
    }

    self.postMessage({
      type: 'SECURITY_STATUS_UPDATE',
      payload: {
        lastActiveTime: state.lastActiveTime,
        violations: Array.from(state.violations.entries()),
      },
    })
  }, 30 * 1000) // Every 30 seconds
}

// Initialize security features
function initSecurity(config: SecurityConfig, fingerprint: string) {
  state = {
    ...state,
    config,
    fingerprint,
    isInitialized: true,
    activeTabId: crypto.randomUUID(),
  }

  // Initialize all security features
  initScreenshotDetection()
  startPeriodicValidation()
  startActivityMonitoring()

  // Add event listeners
  self.addEventListener('keydown', handlers.handleKeyDown)
  self.addEventListener('copy', handlers.handleClipboard)
  self.addEventListener('paste', handlers.handleClipboard)
  self.addEventListener('cut', handlers.handleClipboard)
  self.addEventListener('visibilitychange', handlers.handleVisibility)
  self.addEventListener('fullscreenchange', handlers.handleFullScreen)
  self.addEventListener('contextmenu', handlers.handleContextMenu)
}

// Message handler
self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data

  switch (type) {
    case 'INIT_SECURITY':
      initSecurity(payload.config, payload.fingerprint)
      break

    case 'USER_ACTIVITY':
      state.lastActiveTime = Date.now()
      break

    case 'VALIDATION_RESPONSE':
      if (!payload.isValid) {
        reportViolation(ViolationType.PERIODIC_CHECK_FAILED)
      }
      break

    default:
      console.warn('Unknown message type:', type)
  }
}

// Export type for TypeScript
export type {} // Empty export to make it a module
