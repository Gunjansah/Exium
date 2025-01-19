// using canvas to reduce memory usage for now
// we can switch to tensorflow.js if needed (might be a bit resource heavy)
// but it's not a priority right now
// we need to ship this thing asap

import { ViolationType } from '@prisma/client'

interface PresenceConfig {
  checkInterval: number      // How often to check (ms)
  motionThreshold: number   // How much motion is considered "present"
  brightnessThreshold: number // Minimum brightness level
  maxConsecutiveFailures: number
}

export class PresenceDetector {
  private video: HTMLVideoElement | null = null
  private canvas: OffscreenCanvas
  private context: OffscreenCanvasRenderingContext2D | null = null
  private previousFrame: ImageData | null = null
  private consecutiveFailures = 0
  private checkInterval: number

  constructor(
    private readonly onViolation: (type: ViolationType, details: any) => void,
    private readonly config: PresenceConfig = {
      checkInterval: 5000,      // Check every 5 seconds
      motionThreshold: 20,      // 20% difference threshold
      brightnessThreshold: 30,  // Minimum brightness level (0-255)
      maxConsecutiveFailures: 3
    }
  ) {
    this.canvas = new OffscreenCanvas(320, 240) // Lower resolution for performance
    this.context = this.canvas.getContext('2d')
    this.checkInterval = 0
  }

  public async start(videoElement: HTMLVideoElement) {
    this.video = videoElement
    this.startMonitoring()
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    this.video = null
    this.previousFrame = null
  }

  private startMonitoring() {
    if (!this.video || !this.context) return

    this.checkInterval = window.setInterval(() => {
      this.checkPresence()
    }, this.config.checkInterval)
  }

  private checkPresence() {
    if (!this.video || !this.context || this.video.paused || this.video.ended) {
      return
    }

    // Draw current frame
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
    const currentFrame = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)

    // Check brightness
    const brightness = this.calculateBrightness(currentFrame)
    if (brightness < this.config.brightnessThreshold) {
      this.handleViolation('low_brightness', brightness)
      return
    }

    // Check motion if we have a previous frame
    if (this.previousFrame) {
      const motionScore = this.calculateMotion(currentFrame, this.previousFrame)
      if (motionScore < this.config.motionThreshold) {
        this.handleViolation('no_motion', motionScore)
      } else {
        // Reset failures if we detect good motion
        this.consecutiveFailures = 0
      }
    }

    this.previousFrame = currentFrame
  }

  private calculateBrightness(imageData: ImageData): number {
    const data = imageData.data
    let brightness = 0
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
    }

    return brightness / (data.length / 16)
  }

  private calculateMotion(current: ImageData, previous: ImageData): number {
    const currentData = current.data
    const previousData = previous.data
    let diffCount = 0
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < currentData.length; i += 16) {
      const diff = Math.abs(currentData[i] - previousData[i]) +
                  Math.abs(currentData[i + 1] - previousData[i + 1]) +
                  Math.abs(currentData[i + 2] - previousData[i + 2])
      
      if (diff > 30) { // Threshold for pixel difference
        diffCount++
      }
    }

    return (diffCount / (currentData.length / 16)) * 100
  }

  private handleViolation(reason: string, value: number) {
    this.consecutiveFailures++
    
    if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      this.onViolation(ViolationType.WEBCAM_VIOLATION, {
        reason,
        value,
        consecutiveFailures: this.consecutiveFailures
      })
    }
  }
}
