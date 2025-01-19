import { ViolationType } from '@prisma/client'

interface KeystrokePattern {
  key: string
  timestamp: number
  duration: number
  pressure?: number // For devices that support pressure sensitivity
  interval: number // Time since last keystroke
}

interface MousePattern {
  x: number
  y: number
  timestamp: number
  type: 'move' | 'click' | 'scroll'
  speed?: number
  acceleration?: number
}

interface BehaviorMetrics {
  typingSpeed: number // Characters per minute
  typingRhythm: number // Consistency in typing intervals
  pauseFrequency: number // Number of pauses > 2 seconds
  mouseMovementPattern: 'natural' | 'erratic' | 'suspicious'
  focusChanges: number // Number of focus changes
  suspiciousPatterns: number
}

class BehaviorAnalyzer {
  private keystrokeBuffer: KeystrokePattern[] = []
  private mousePatternBuffer: MousePattern[] = []
  private metrics: BehaviorMetrics = {
    typingSpeed: 0,
    typingRhythm: 0,
    pauseFrequency: 0,
    mouseMovementPattern: 'natural',
    focusChanges: 0,
    suspiciousPatterns: 0
  }

  private lastKeystroke: number = Date.now()
  private lastMouseMove: number = Date.now()

  constructor(
    private readonly onViolation: (type: ViolationType, details: any) => void,
    private readonly config: {
      maxBufferSize: number
      analysisInterval: number
      suspiciousThreshold: number
    }
  ) {
    this.startPeriodicAnalysis()
  }

  public recordKeystroke(event: KeyboardEvent): void {
    const now = Date.now()
    const pattern: KeystrokePattern = {
      key: event.key,
      timestamp: now,
      duration: event.timeStamp,
      interval: now - this.lastKeystroke
    }

    this.keystrokeBuffer.push(pattern)
    if (this.keystrokeBuffer.length > this.config.maxBufferSize) {
      this.keystrokeBuffer.shift()
    }

    this.lastKeystroke = now
    this.analyzeKeystrokePattern()
  }

  public recordMouseMovement(event: MouseEvent): void {
    const now = Date.now()
    const pattern: MousePattern = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now,
      type: event.type as 'move' | 'click' | 'scroll',
      speed: this.calculateMouseSpeed(event)
    }

    this.mousePatternBuffer.push(pattern)
    if (this.mousePatternBuffer.length > this.config.maxBufferSize) {
      this.mousePatternBuffer.shift()
    }

    this.lastMouseMove = now
    this.analyzeMousePattern()
  }

  private calculateMouseSpeed(event: MouseEvent): number {
    if (this.mousePatternBuffer.length === 0) return 0

    const lastPattern = this.mousePatternBuffer[this.mousePatternBuffer.length - 1]
    const dx = event.clientX - lastPattern.x
    const dy = event.clientY - lastPattern.y
    const dt = Date.now() - lastPattern.timestamp
    return Math.sqrt(dx * dx + dy * dy) / dt
  }

  private analyzeKeystrokePattern(): void {
    if (this.keystrokeBuffer.length < 10) return

    // Calculate typing speed
    const timeSpan = this.keystrokeBuffer[this.keystrokeBuffer.length - 1].timestamp - 
                    this.keystrokeBuffer[0].timestamp
    this.metrics.typingSpeed = (this.keystrokeBuffer.length / timeSpan) * 60000

    // Analyze rhythm consistency
    const intervals = this.keystrokeBuffer.map(k => k.interval)
    this.metrics.typingRhythm = this.calculateStandardDeviation(intervals)

    // Detect suspicious patterns
    if (this.detectAutomatedTyping()) {
      this.onViolation(ViolationType.AUTOMATION_DETECTED, {
        type: 'keystroke_pattern',
        metrics: this.metrics
      })
    }
  }

  private analyzeMousePattern(): void {
    if (this.mousePatternBuffer.length < 10) return

    // Analyze mouse movement patterns
    const speeds = this.mousePatternBuffer.map(m => m.speed || 0)
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length
    const speedVariation = this.calculateStandardDeviation(speeds)

    // Detect unnatural movements
    if (avgSpeed > this.config.suspiciousThreshold || speedVariation < 0.1) {
      this.metrics.mouseMovementPattern = 'suspicious'
      this.onViolation(ViolationType.AUTOMATION_DETECTED, {
        type: 'mouse_pattern',
        metrics: {
          averageSpeed: avgSpeed,
          speedVariation,
          pattern: this.metrics.mouseMovementPattern
        }
      })
    }
  }

  private detectAutomatedTyping(): boolean {
    // Check for inhuman typing speed
    if (this.metrics.typingSpeed > 400) return true

    // Check for too consistent typing rhythm
    if (this.metrics.typingRhythm < 0.1) return true

    // Check for repetitive patterns
    return this.hasRepetitivePattern()
  }

  private hasRepetitivePattern(): boolean {
    const pattern = this.keystrokeBuffer.map(k => k.key).join('')
    const subPatterns = new Set<string>()
    
    for (let i = 0; i < pattern.length - 3; i++) {
      const subPattern = pattern.slice(i, i + 3)
      if (subPatterns.has(subPattern)) return true
      subPatterns.add(subPattern)
    }

    return false
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const squareDiffs = values.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length)
  }

  private startPeriodicAnalysis(): void {
    setInterval(() => {
      this.analyzeKeystrokePattern()
      this.analyzeMousePattern()
      
      // Clear old data
      const now = Date.now()
      const timeThreshold = now - (5 * 60 * 1000) // 5 minutes
      this.keystrokeBuffer = this.keystrokeBuffer.filter(k => k.timestamp > timeThreshold)
      this.mousePatternBuffer = this.mousePatternBuffer.filter(m => m.timestamp > timeThreshold)
    }, this.config.analysisInterval)
  }
}

export { BehaviorAnalyzer, type BehaviorMetrics, type KeystrokePattern, type MousePattern }
