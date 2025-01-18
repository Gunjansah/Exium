// Helper Functions for Security Detection

// Generate a unique hardware ID based on system characteristics
async function generateHardwareId(): Promise<string> {
  const nav = navigator as ExtendedNavigator
  const components = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.pixelDepth,
    screen.width,
    screen.height,
    nav.hardwareConcurrency,
    nav.deviceMemory || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    await getGPUInfo(),
    await generateAudioFingerprint(),
  ]

  const fingerprint = components.join('###')
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Get GPU information for hardware fingerprinting
async function getGPUInfo(): Promise<string> {
  const canvas = new OffscreenCanvas(256, 256)
  const gl = canvas.getContext('webgl2')
  
  if (!gl) return 'no_webgl'

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (!debugInfo) return 'no_debug_info'

  return [
    gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    gl.getParameter(gl.VERSION),
    gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
  ].join('|')
}

// Generate audio fingerprint using AudioContext
async function generateAudioFingerprint(): Promise<string> {
  const audioContext = new OfflineAudioContext(1, 44100, 44100)
  const oscillator = audioContext.createOscillator()
  const analyser = audioContext.createAnalyser()
  
  oscillator.connect(analyser)
  analyser.connect(audioContext.destination)
  
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(10000, audioContext.currentTime)
  oscillator.start()
  
  const audioBuffer = await audioContext.startRendering()
  const audioData = new Float32Array(analyser.frequencyBinCount)
  analyser.getFloatFrequencyData(audioData)
  
  return Array.from(audioData)
    .slice(0, 10)
    .map(x => x.toString(16))
    .join('')
}

// Generate WebGL fingerprint
function generateWebGLFingerprint(): string {
  const canvas = new OffscreenCanvas(256, 256)
  const gl = canvas.getContext('webgl2')
  if (!gl) return 'no_webgl'

  // Draw a complex scene
  const vertices = new Float32Array([
    -0.5, -0.5, 0.5, -0.5, 0.0, 0.5
  ])

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vertexShader, `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `)
  gl.compileShader(vertexShader)

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fragmentShader, `
    precision highp float;
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `)
  gl.compileShader(fragmentShader)

  const program = gl.createProgram()!
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.useProgram(program)

  const positionLocation = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

  gl.drawArrays(gl.TRIANGLES, 0, 3)

  // Get the rendered image data
  const pixels = new Uint8Array(256 * 256 * 4)
  gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  // Generate a hash of the image data
  return Array.from(pixels)
    .reduce((hash, val) => ((hash << 5) - hash) + val, 0)
    .toString(36)
}

// Generate canvas fingerprint
async function generateCanvasFingerprint(): Promise<string> {
  const canvas = new OffscreenCanvas(200, 50)
  const ctx = canvas.getContext('2d')!
  
  // Draw complex shapes and text
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillStyle = '#f60'
  ctx.fillRect(125, 1, 62, 20)
  ctx.fillStyle = '#069'
  ctx.fillText('Exam Security', 2, 15)
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
  ctx.fillText('Canvas FP', 4, 17)
  
  const blob = await canvas.convertToBlob()
  const buffer = await blob.arrayBuffer()
  const array = new Uint8Array(buffer)
  return Array.from(array)
    .reduce((hash, val) => ((hash << 5) - hash) + val, 0)
    .toString(36)
}

// Detect browser extensions
async function detectBrowserExtensions(): Promise<string[]> {
  const extensions: string[] = []
  
  // Check for common extension APIs
  const knownAPIs = [
    'chrome',
    'browser',
    'GM',
    'GM_info',
    'GM_getValue',
    'GM_setValue',
  ]

  for (const api of knownAPIs) {
    if ((window as any)[api]) {
      extensions.push(api)
    }
  }

  // Check for extension-specific DOM elements
  const extensionSelectors = [
    '#firebug-script-panel',
    '#FirebugUI',
    '#__vue-devtools-root__',
    '#react-devtools-root',
  ]

  extensions.push(...extensionSelectors.filter(selector => 
    document.querySelector(selector)
  ))

  // Check for modified native functions
  const nativeFunctions = [
    'toString',
    'valueOf',
    'defineProperty',
  ] as const

  type NativeFunction = typeof nativeFunctions[number]

  for (const fn of nativeFunctions) {
    const func = Function.prototype[fn as keyof Function] as Function
    if (func.toString().length !== Function.prototype.toString.length) {
      extensions.push(`modified_${fn}`)
    }
  }

  return extensions
}

// Detect VPN usage
async function detectVPN(): Promise<boolean> {
  try {
    // Check for WebRTC leaks
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    pc.createDataChannel('')
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    return new Promise((resolve) => {
      let vpnDetected = false
      
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          pc.close()
          resolve(vpnDetected)
          return
        }

        // Check for private IP ranges in ICE candidates
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
        const match = ipRegex.exec(e.candidate.candidate)
        if (match) {
          const ip = match[1]
          if (
            ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
          ) {
            vpnDetected = true
          }
        }
      }
    })
  } catch {
    return false
  }
}

// Detect proxy usage
async function detectProxy(): Promise<boolean> {
  try {
    const startTime = performance.now()
    const response = await fetch('https://www.google.com/generate_204')
    const endTime = performance.now()
    
    // Check response timing (proxies typically add latency)
    const responseTime = endTime - startTime
    if (responseTime > 1000) { // More than 1 second suggests a proxy
      return true
    }

    // Check for proxy headers
    const headers = response.headers
    const proxyHeaders = [
      'via',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'forwarded',
      'proxy-connection',
    ]

    return proxyHeaders.some(header => headers.get(header) !== null)
  } catch {
    // Network error might indicate proxy blocking
    return true
  }
}

// Detect virtual machine environment
function detectVirtualMachine(): boolean {
  const nav = navigator as ExtendedNavigator
  const indicators = [
    // Check for common VM artifacts
    nav.hardwareConcurrency < 2,
    nav.deviceMemory !== undefined && nav.deviceMemory < 4,
    !('bluetooth' in nav),
    !('usb' in nav),
    screen.width < 1024 || screen.height < 768,
    
    // Check for VM-specific GPU strings
    /virtualbox|vmware|parallels|qemu|xen|oracle|virtual|microsoft basic display adapter/i
      .test(getGPUVendor()),
    
    // Check for suspicious timing
    checkTimingAccuracy(),
  ]

  return indicators.filter(Boolean).length >= 3
}

// Get GPU vendor information
function getGPUVendor(): string {
  const canvas = new OffscreenCanvas(1, 1)
  const gl = canvas.getContext('webgl2')
  if (!gl) return ''

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (!debugInfo) return ''

  return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL).toLowerCase()
}

// Check timing accuracy (VMs often have less accurate timers)
function checkTimingAccuracy(): boolean {
  const measurements: number[] = []
  const startTime = performance.now()
  
  for (let i = 0; i < 100; i++) {
    const start = performance.now()
    let end = start
    while (end - start < 1) {
      end = performance.now()
    }
    measurements.push(end - start)
  }

  // Calculate standard deviation of measurements
  const avg = measurements.reduce((a, b) => a + b) / measurements.length
  const variance = measurements.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / measurements.length
  const stdDev = Math.sqrt(variance)

  // VMs typically have higher variance in timing
  return stdDev > 0.5
}

// Update network information
function updateNetworkInfo() {
  const nav = navigator as ExtendedNavigator
  if (nav.connection) {
    state.networkInfo = {
      ...state.networkInfo,
      connectionType: nav.connection.type,
      effectiveType: nav.connection.effectiveType,
      downlink: nav.connection.downlink,
      rtt: nav.connection.rtt,
    }
  }
}

// Validate security state periodically
function validateSecurityState() {
  const nav = navigator as ExtendedNavigator
  
  // Check for suspicious browser configurations
  if (nav.webdriver) {
    reportViolation(ViolationType.AUTOMATION_DETECTED, {
      type: 'webdriver_detected'
    }, 'high')
  }

  // Check for debugger
  const originalToString = Function.prototype.toString
  if (originalToString.toString().length !== originalToString.length) {
    reportViolation(ViolationType.API_TAMPERING, {
      type: 'function_tampering'
    }, 'high')
  }

  // Check for modified timer functions
  const originalSetTimeout = setTimeout
  if (setTimeout !== originalSetTimeout) {
    reportViolation(ViolationType.API_TAMPERING, {
      type: 'timer_tampering'
    }, 'high')
  }

  // Check for suspicious performance characteristics
  const timing = performance.timing
  if (timing.fetchStart - timing.navigationStart > 1000) {
    reportViolation(ViolationType.SUSPICIOUS_MOVEMENT, {
      type: 'abnormal_timing'
    }, 'medium')
  }
}

"use strict"

import { ViolationType } from '@prisma/client'

// Enhanced Security Interfaces
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
  deviceInfo: DeviceInfo
  networkInfo: NetworkInfo
  browserInfo: BrowserInfo
  lastValidationTime: number
  suspiciousActivities: SuspiciousActivity[]
}

interface DeviceInfo {
  hardwareId: string
  screenResolution: string
  colorDepth: number
  platform: string
  deviceMemory?: number
  hardwareConcurrency: number
  touchPoints: number
  batteryLevel?: number
  isVirtualMachine: boolean
}

interface NetworkInfo {
  ip?: string
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  isVPN: boolean
  proxy: boolean
}

interface BrowserInfo {
  userAgent: string
  plugins: string[]
  mimeTypes: string[]
  languages: readonly string[]
  timezone: string
  canvas: Promise<string>
  webgl: string
  audioContext: string
  extensions: string[]
}

interface SuspiciousActivity {
  type: ViolationType
  timestamp: number
  details: any
  severity: 'low' | 'medium' | 'high'
  context: Record<string, any>
}

// Initialize state with enhanced security monitoring
let state: SecurityState = {
  config: {} as SecurityConfig,
  fingerprint: '',
  isInitialized: false,
  lastActiveTime: Date.now(),
  activeTabId: crypto.randomUUID(),
  violations: new Map(),
  deviceInfo: {} as DeviceInfo,
  networkInfo: {} as NetworkInfo,
  browserInfo: {} as BrowserInfo,
  lastValidationTime: Date.now(),
  suspiciousActivities: []
}

// Enhanced Security Event Handlers
const handlers = {
  // Keyboard Security
  handleKeyDown: (e: KeyboardEvent) => {
    if (!state.config.blockKeyboardShortcuts) return

    const isShortcut = e.ctrlKey || e.metaKey || e.altKey
    const blockedKeys = new Set(['c', 'v', 'x', 'p', 'r', 'f', 'tab', 'printscreen', 'f12'])
    const functionKeys = Array.from({ length: 12 }, (_, i) => `f${i + 1}`)
    
    // Block all function keys
    if (functionKeys.includes(e.key.toLowerCase())) {
      e.preventDefault()
      reportViolation(ViolationType.KEYBOARD_SHORTCUT, {
        key: e.key,
        modifiers: {
          ctrl: e.ctrlKey,
          alt: e.altKey,
          shift: e.shiftKey,
          meta: e.metaKey
        }
      }, 'medium')
      return
    }

    // Block specific shortcuts
    if (isShortcut && blockedKeys.has(e.key.toLowerCase())) {
      e.preventDefault()
      e.stopPropagation()
      reportViolation(ViolationType.KEYBOARD_SHORTCUT, {
        key: e.key,
        modifiers: {
          ctrl: e.ctrlKey,
          alt: e.altKey,
          shift: e.shiftKey,
          meta: e.metaKey
        }
      }, 'high')
    }

    // Monitor rapid key sequences
    monitorKeySequence(e)
  },

  // Enhanced Clipboard Security
  handleClipboard: (e: ClipboardEvent) => {
    if (!state.config.blockClipboard) return

    e.preventDefault()
    e.stopPropagation()

    const clipboardData = e.clipboardData?.getData('text') || ''
    reportViolation(ViolationType.CLIPBOARD_USAGE, {
      action: e.type,
      dataLength: clipboardData.length,
      timestamp: Date.now()
    }, 'high')

    // Clear clipboard data
    e.clipboardData?.clearData()
  },

  // Advanced Tab Visibility Monitoring
  handleVisibility: () => {
    if (!state.config.blockMultipleTabs) return

    const now = Date.now()
    const timeSinceLastCheck = now - state.lastValidationTime

    if (document.hidden) {
      // Check if tab switch was too quick (potential tab switching attempt)
      if (timeSinceLastCheck < 1000) {
        reportViolation(ViolationType.TAB_SWITCH, {
          timeSinceLastCheck,
          pattern: 'rapid_switching'
        }, 'high')
      } else {
        reportViolation(ViolationType.TAB_SWITCH, {
          timeSinceLastCheck,
          pattern: 'normal'
        }, 'medium')
      }
    }

    state.lastValidationTime = now
    checkBrowserState()
  },

  // Enhanced Full Screen Monitoring
  handleFullScreen: () => {
    if (!state.config.fullScreenMode) return

    const isFullScreen = document.fullscreenElement !== null
    
    // Send status update to main thread
    self.postMessage({
      type: 'SECURITY_STATUS_UPDATE',
      payload: {
        type: 'FULLSCREEN',
        status: isFullScreen
      }
    })

    if (!isFullScreen) {
      // Check if there was a recent violation
      const recentViolation = state.suspiciousActivities.some(
        activity => 
          activity.type === ViolationType.FULL_SCREEN_EXIT &&
          Date.now() - activity.timestamp < 60000
      )

      // Record violation
      reportViolation(ViolationType.FULL_SCREEN_EXIT, {
        repeated: recentViolation,
        timestamp: Date.now(),
        screenInfo: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight
        }
      }, recentViolation ? 'high' : 'medium')

      // Notify main thread about violation
      self.postMessage({
        type: 'VIOLATION_DETECTED',
        payload: {
          violationType: ViolationType.FULL_SCREEN_EXIT,
          message: 'Full screen mode is required. Exam temporarily locked.',
          severity: recentViolation ? 'high' : 'medium'
        }
      })
    }
  },
  
  // Enhanced Right Click Prevention
  handleContextMenu: (e: MouseEvent) => {
    if (!state.config.blockRightClick) return

    e.preventDefault()
    e.stopPropagation()

    reportViolation(ViolationType.RIGHT_CLICK, {
      position: { x: e.x, y: e.y },
      timestamp: Date.now()
    }, 'medium')
  },
}

// Advanced Security Monitoring Functions
function monitorKeySequence(e: KeyboardEvent) {
  const MAX_SEQUENCE_TIME = 500 // ms
  const keySequence = state.suspiciousActivities
    .filter(activity => 
      activity.type === ViolationType.KEYBOARD_SHORTCUT &&
      Date.now() - activity.timestamp < MAX_SEQUENCE_TIME
    )

  if (keySequence.length > 5) {
    reportViolation(ViolationType.AUTOMATION_DETECTED, {
      sequence: keySequence,
      lastKey: e.key
    }, 'high')
  }
}

function validateScreenConfiguration() {
  const screenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth
  }

  // Check for virtual machines or remote desktop
  if (
    screenInfo.width === screenInfo.availWidth &&
    screenInfo.height === screenInfo.availHeight &&
    screenInfo.colorDepth % 8 === 0
  ) {
    reportViolation(ViolationType.VIRTUAL_MACHINE_DETECTED, {
      screenInfo,
      evidence: 'screen_characteristics'
    }, 'high')
  }
}

function checkBrowserState() {
  // Check for developer tools
  const devToolsHeight = window.outerHeight - window.innerHeight
  if (devToolsHeight > 100) {
    reportViolation(ViolationType.BROWSER_EXTENSION_DETECTED, {
      type: 'devtools',
      height: devToolsHeight
    }, 'high')
  }

  // Check for browser extensions
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    reportViolation(ViolationType.BROWSER_EXTENSION_DETECTED, {
      type: 'extension',
      id: chrome.runtime.id
    }, 'medium')
  }
}

// Enhanced Screenshot Prevention
function initScreenshotDetection() {
  if (!state.config.screenshotBlocking) return

  // Monitor screen capture API
  if (navigator.mediaDevices) {
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia
    navigator.mediaDevices.getDisplayMedia = async () => {
      reportViolation(ViolationType.SCREENSHOT_ATTEMPT, {
        method: 'getDisplayMedia',
        timestamp: Date.now()
      }, 'high')
      throw new Error('Screen capture is not allowed during exam')
    }
  }

  // Enhanced canvas protection
  const originalToBlob = HTMLCanvasElement.prototype.toBlob
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
  
  HTMLCanvasElement.prototype.toBlob = function(
    callback: BlobCallback,
    type?: string,
    quality?: any
  ) {
    reportViolation(ViolationType.SCREENSHOT_ATTEMPT, {
      method: 'toBlob',
      type,
      quality,
      timestamp: Date.now()
    }, 'high')
    
    // Return a black image instead of the actual content
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    return originalToBlob.call(canvas, callback, type, quality)
  }
  
  HTMLCanvasElement.prototype.toDataURL = function(type?: string, quality?: any) {
    reportViolation(ViolationType.SCREENSHOT_ATTEMPT, {
      method: 'toDataURL',
      type,
      quality,
      timestamp: Date.now()
    }, 'high')
    
    // Return a black image data URL
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    return originalToDataURL.call(canvas, type, quality)
  }

  // Monitor print screen key
  document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
      reportViolation(ViolationType.SCREENSHOT_ATTEMPT, {
        method: 'printScreen',
        timestamp: Date.now()
      }, 'high')
    }
  })
}

// Enhanced Violation Reporting
function reportViolation(
  type: ViolationType,
  details: any,
  severity: 'low' | 'medium' | 'high'
) {
  const currentCount = state.violations.get(type) || 0
  state.violations.set(type, currentCount + 1)

  const suspiciousActivity: SuspiciousActivity = {
    type,
    timestamp: Date.now(),
    details,
    severity,
    context: {
      deviceInfo: state.deviceInfo,
      networkInfo: state.networkInfo,
      browserInfo: state.browserInfo,
      previousViolations: currentCount
    }
  }

  state.suspiciousActivities.push(suspiciousActivity)

  // Clean up old activities
  const ONE_HOUR = 3600000
  state.suspiciousActivities = state.suspiciousActivities.filter(
    activity => Date.now() - activity.timestamp < ONE_HOUR
  )

  self.postMessage({
    type: 'VIOLATION_DETECTED',
    payload: {
      violationType: type,
      details: suspiciousActivity,
      timestamp: Date.now(),
    },
  })

  // Check for pattern-based violations
  analyzeViolationPatterns()
}

// Pattern Analysis for Advanced Threat Detection
function analyzeViolationPatterns() {
  const ANALYSIS_WINDOW = 300000 // 5 minutes
  const recentActivities = state.suspiciousActivities.filter(
    activity => Date.now() - activity.timestamp < ANALYSIS_WINDOW
  )

  // Check for rapid succession of different violation types
  const violationTypes = new Set(recentActivities.map(a => a.type))
  if (violationTypes.size >= 3) {
    reportViolation(ViolationType.AUTOMATION_DETECTED, {
      pattern: 'multiple_violation_types',
      types: Array.from(violationTypes),
      timeWindow: ANALYSIS_WINDOW
    }, 'high')
  }

  // Check for periodic patterns
  const intervals = recentActivities
    .map((a, i, arr) => i > 0 ? a.timestamp - arr[i-1].timestamp : 0)
    .slice(1)

  if (intervals.length >= 3) {
    const isRegular = intervals.every((interval, i, arr) => 
      i === 0 || Math.abs(interval - arr[i-1]) < 100
    )
    
    if (isRegular) {
      reportViolation(ViolationType.AUTOMATION_DETECTED, {
        pattern: 'regular_intervals',
        intervals,
        timeWindow: ANALYSIS_WINDOW
      }, 'high')
    }
  }
}

// Enhanced Device and Network Monitoring
async function initDeviceMonitoring() {
  try {
    // Get detailed device information
    const nav = navigator as ExtendedNavigator
    const deviceInfo: Partial<DeviceInfo> = {
      hardwareId: await generateHardwareId(),
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      platform: nav.platform,
      hardwareConcurrency: nav.hardwareConcurrency,
      touchPoints: nav.maxTouchPoints,
    }

    // Check for battery status
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery()
      deviceInfo.batteryLevel = battery.level
    }

    // Check for virtual machine indicators
    deviceInfo.isVirtualMachine = detectVirtualMachine()

    state.deviceInfo = deviceInfo as DeviceInfo

    // Monitor network conditions
    if (nav.connection) {
      state.networkInfo = {
        connectionType: nav.connection.type,
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt,
        isVPN: await detectVPN(),
        proxy: await detectProxy()
      }

      nav.connection.addEventListener('change', updateNetworkInfo)
    }

    // Monitor browser environment
    state.browserInfo = await initBrowserInfo()
  } catch (error: unknown) {
    console.error('Failed to initialize device monitoring:', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Monitor browser environment
async function initBrowserInfo(): Promise<BrowserInfo> {
  return {
    userAgent: navigator.userAgent,
    plugins: Array.from(navigator.plugins).map(p => p.name),
    mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type),
    languages: navigator.languages,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: generateCanvasFingerprint(),
    webgl: generateWebGLFingerprint(),
    audioContext: await generateAudioFingerprint(),
    extensions: await detectBrowserExtensions()
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
      reportViolation(ViolationType.INACTIVITY, {
        inactiveTime,
        lastActiveTime: state.lastActiveTime
      }, 'medium')
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

// Initialize all security features
async function initSecurity(config: SecurityConfig, fingerprint: string) {
  state = {
    ...state,
    config,
    fingerprint,
    isInitialized: true,
    activeTabId: crypto.randomUUID(),
    lastValidationTime: Date.now()
  }

  // Initialize all security features
  await initDeviceMonitoring()
  initScreenshotDetection()
  startPeriodicValidation()
  startActivityMonitoring()

  // Add event listeners with passive: false for better intervention
  document.addEventListener('keydown', handlers.handleKeyDown, { passive: false })
  document.addEventListener('copy', handlers.handleClipboard, { passive: false })
  document.addEventListener('paste', handlers.handleClipboard, { passive: false })
  document.addEventListener('cut', handlers.handleClipboard, { passive: false })
  document.addEventListener('visibilitychange', handlers.handleVisibility)
  document.addEventListener('fullscreenchange', handlers.handleFullScreen)
  document.addEventListener('contextmenu', handlers.handleContextMenu, { passive: false })

  // Initialize periodic security checks
  setInterval(validateSecurityState, 5000)
}

// Message handler with enhanced error handling
self.onmessage = (event: MessageEvent) => {
  try {
    const { type, payload } = event.data

    switch (type) {
      case 'INIT_SECURITY':
        initSecurity(payload.config, payload.fingerprint)
          .catch((error: unknown) => {
            console.error('Failed to initialize security:', error instanceof Error ? error.message : 'Unknown error')
            self.postMessage({
              type: 'SECURITY_ERROR',
              payload: {
                error: 'Failed to initialize security system',
                details: error instanceof Error ? error.message : 'Unknown error'
              }
            })
          })
        break

      case 'USER_ACTIVITY':
        state.lastActiveTime = Date.now()
        break

      case 'VALIDATION_RESPONSE':
        if (!payload.isValid) {
          reportViolation(ViolationType.PERIODIC_CHECK_FAILED, {
            timestamp: Date.now(),
            validationType: payload.type
          }, 'high')
        }
        break

      default:
        console.warn('Unknown message type:', type)
    }
  } catch (error: unknown) {
    console.error('Error handling message:', error instanceof Error ? error.message : 'Unknown error')
    self.postMessage({
      type: 'SECURITY_ERROR',
      payload: {
        error: 'Error handling security message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

// Custom type definitions for browser APIs
interface ExtendedNavigator extends Omit<Navigator, 'webdriver'> {
  deviceMemory?: number;
  connection?: {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
    addEventListener: (type: string, listener: EventListener) => void;
  };
  webdriver?: boolean;
}

interface Chrome {
  runtime?: {
    id?: string;
  };
}

declare const chrome: Chrome;

export type {} // Empty export to make it a module
