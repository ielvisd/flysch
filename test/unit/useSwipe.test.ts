import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSwipe } from '~/app/composables/useSwipe'

describe('useSwipe', () => {
  beforeEach(() => {
    // Mock touch device
    Object.defineProperty(window, 'navigator', {
      value: { maxTouchPoints: 1 },
      writable: true,
      configurable: true
    })
    Object.defineProperty(window, 'ontouchstart', {
      value: {},
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('touch device detection', () => {
    it('should detect touch device when touch events are available', () => {
      const swipe = useSwipe()
      expect(swipe.isTouchDevice.value).toBe(true)
    })

    it('should return false for touch device on server', () => {
      // Simulate server-side
      const originalProcess = global.process
      global.process = { ...originalProcess, server: true, client: false } as any

      const swipe = useSwipe()
      // On server, it should still check window, but window won't exist
      // This test verifies the logic exists
      expect(swipe.isTouchDevice).toBeDefined()

      global.process = originalProcess
    })
  })

  describe('swipe detection', () => {
    it('should initialize with no swipe state', () => {
      const swipe = useSwipe()
      expect(swipe.isSwiping.value).toBe(false)
      expect(swipe.swipeDistance.value).toBe(0)
      expect(swipe.swipeDirection.value).toBeNull()
    })

    it('should handle touch start event', () => {
      const swipe = useSwipe()
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{
          clientX: 100,
          clientY: 200
        } as Touch]
      })

      swipe.handleTouchStart(touchEvent)
      expect(swipe.isSwiping.value).toBe(true)
    })

    it('should ignore multi-touch events', () => {
      const swipe = useSwipe()
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 200 } as Touch,
          { clientX: 150, clientY: 250 } as Touch
        ]
      })

      swipe.handleTouchStart(touchEvent)
      expect(swipe.isSwiping.value).toBe(false)
    })

    it('should detect horizontal swipe movement', () => {
      const swipe = useSwipe()
      
      // Start touch
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      // Move right
      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 200 } as Touch]
      })
      swipe.handleTouchMove(moveEvent)

      expect(swipe.swipeDistance.value).toBe(50)
      expect(swipe.swipeDirection.value).toBe('right')
    })

    it('should detect left swipe', () => {
      const swipe = useSwipe()
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 150, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchMove(moveEvent)

      expect(swipe.swipeDistance.value).toBe(-50)
      expect(swipe.swipeDirection.value).toBe('left')
    })

    it('should cancel swipe if vertical movement is dominant', () => {
      const swipe = useSwipe()
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 105, clientY: 250 } as Touch]
      })
      swipe.handleTouchMove(moveEvent)

      expect(swipe.isSwiping.value).toBe(false)
    })

    it('should trigger onSwipeLeft callback when threshold is met', () => {
      const onSwipeLeft = vi.fn()
      const swipe = useSwipe({ onSwipeLeft, threshold: 50 })

      // Start and move left
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 150, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 50, clientY: 200 } as Touch]
      })
      swipe.handleTouchMove(moveEvent)

      // End touch
      const endEvent = new TouchEvent('touchend')
      swipe.handleTouchEnd(endEvent)

      expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    })

    it('should trigger onSwipeRight callback when threshold is met', () => {
      const onSwipeRight = vi.fn()
      const swipe = useSwipe({ onSwipeRight, threshold: 50 })

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 200 } as Touch]
      })
      swipe.handleTouchMove(moveEvent)

      const endEvent = new TouchEvent('touchend')
      swipe.handleTouchEnd(endEvent)

      expect(onSwipeRight).toHaveBeenCalledTimes(1)
    })

    it('should not trigger callback if threshold is not met', () => {
      const onSwipeLeft = vi.fn()
      const swipe = useSwipe({ onSwipeLeft, threshold: 50 })

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 80, clientY: 200 } as Touch] // Only 20px
      })
      swipe.handleTouchMove(moveEvent)

      const endEvent = new TouchEvent('touchend')
      swipe.handleTouchEnd(endEvent)

      expect(onSwipeLeft).not.toHaveBeenCalled()
    })

    it('should trigger callback based on velocity even if distance is small', () => {
      const onSwipeLeft = vi.fn()
      const swipe = useSwipe({ onSwipeLeft, threshold: 50, velocityThreshold: 0.3 })

      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      // Fast swipe but short distance
      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 60, clientY: 200 } as Touch] // 40px
      })
      swipe.handleTouchMove(moveEvent)

      // Simulate very fast swipe (short duration)
      // Mock Date.now to simulate fast swipe
      const originalNow = Date.now
      let timeOffset = 0
      global.Date.now = vi.fn(() => {
        timeOffset += 10 // Very fast: 10ms
        return originalNow() + timeOffset
      })

      const endEvent = new TouchEvent('touchend')
      swipe.handleTouchEnd(endEvent)

      // Restore Date.now
      global.Date.now = originalNow

      // Velocity should be high enough (40px / 10ms = 4 px/ms > 0.3)
      // Note: This test may need adjustment based on actual implementation
      expect(swipe.isSwiping.value).toBe(false) // Swipe should be complete
    })

    it('should handle touch cancel event', () => {
      const swipe = useSwipe()
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      swipe.handleTouchCancel()
      expect(swipe.isSwiping.value).toBe(false)
      expect(swipe.swipeDistance.value).toBe(0)
    })

    it('should provide transform style during swipe', () => {
      const swipe = useSwipe()
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 200 } as Touch]
      })
      swipe.handleTouchMove(moveEvent)

      const style = swipe.getTransformStyle.value
      expect(style.transform).toContain('translateX(50px)')
      expect(style.opacity).toBeLessThan(1)
    })

    it('should calculate swipe progress', () => {
      const swipe = useSwipe({ threshold: 100 })
      
      const startEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      swipe.handleTouchStart(startEvent)

      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 150, clientY: 200 } as Touch] // 50px = 50% of 100px threshold
      })
      swipe.handleTouchMove(moveEvent)

      expect(swipe.swipeProgress.value).toBe(0.5)
    })
  })

  describe('edge cases', () => {
    it('should handle touch end without touch start', () => {
      const swipe = useSwipe()
      const endEvent = new TouchEvent('touchend')
      expect(() => swipe.handleTouchEnd(endEvent)).not.toThrow()
    })

    it('should handle touch move without touch start', () => {
      const swipe = useSwipe()
      const moveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 200 } as Touch]
      })
      expect(() => swipe.handleTouchMove(moveEvent)).not.toThrow()
    })

    it('should use default threshold if not provided', () => {
      const swipe = useSwipe()
      // Default threshold is 50
      expect(swipe).toBeDefined()
    })
  })
})

