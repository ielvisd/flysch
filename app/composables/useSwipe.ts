import { ref, computed, watch } from 'vue'

/**
 * Composable for detecting swipe gestures on touch devices
 * Supports horizontal swipe detection with velocity calculation
 */
export const useSwipe = (options: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number // Minimum distance in pixels to trigger swipe
  velocityThreshold?: number // Minimum velocity (px/ms) to trigger swipe
  preventVerticalScroll?: boolean // Prevent vertical scroll during horizontal swipe
} = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.3,
    preventVerticalScroll = true
  } = options

  // State
  const isSwiping = ref(false)
  const swipeDistance = ref(0)
  const swipeDirection = ref<'left' | 'right' | null>(null)
  const startX = ref(0)
  const startY = ref(0)
  const startTime = ref(0)
  const currentX = ref(0)
  const currentY = ref(0)

  // Check if device supports touch events
  const isTouchDevice = computed(() => {
    if (process.server) return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  /**
   * Handle touch start event
   */
  const handleTouchStart = (e: TouchEvent) => {
    if (!isTouchDevice.value || e.touches.length !== 1) return

    const touch = e.touches[0]
    if (!touch) return

    startX.value = touch.clientX
    startY.value = touch.clientY
    currentX.value = touch.clientX
    currentY.value = touch.clientY
    startTime.value = Date.now()
    isSwiping.value = true
    swipeDistance.value = 0
    swipeDirection.value = null
  }

  /**
   * Handle touch move event
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping.value || !isTouchDevice.value || e.touches.length !== 1) return

    const touch = e.touches[0]
    if (!touch) return

    currentX.value = touch.clientX
    currentY.value = touch.clientY

    const deltaX = currentX.value - startX.value
    const deltaY = currentY.value - startY.value

    // Determine if this is a horizontal swipe
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)

    if (isHorizontalSwipe) {
      // Prevent vertical scroll during horizontal swipe
      if (preventVerticalScroll) {
        e.preventDefault()
      }

      swipeDistance.value = deltaX
      swipeDirection.value = deltaX > 0 ? 'right' : 'left'
    } else {
      // If vertical movement is dominant, cancel swipe
      if (Math.abs(deltaY) > 20) {
        isSwiping.value = false
        swipeDistance.value = 0
        swipeDirection.value = null
      }
    }
  }

  /**
   * Handle touch end event
   */
  const handleTouchEnd = (e: TouchEvent) => {
    if (!isSwiping.value || !isTouchDevice.value) {
      isSwiping.value = false
      return
    }

    const endTime = Date.now()
    const duration = endTime - startTime.value
    const totalDistance = Math.abs(swipeDistance.value)
    const velocity = duration > 0 ? totalDistance / duration : 0

    // Check if swipe threshold is met
    const meetsDistanceThreshold = totalDistance >= threshold
    const meetsVelocityThreshold = velocity >= velocityThreshold

    if (meetsDistanceThreshold || meetsVelocityThreshold) {
      // Trigger appropriate callback
      if (swipeDirection.value === 'left' && onSwipeLeft) {
        onSwipeLeft()
      } else if (swipeDirection.value === 'right' && onSwipeRight) {
        onSwipeRight()
      }
    }

    // Reset state
    isSwiping.value = false
    swipeDistance.value = 0
    swipeDirection.value = null
  }

  /**
   * Handle touch cancel event
   */
  const handleTouchCancel = () => {
    isSwiping.value = false
    swipeDistance.value = 0
    swipeDirection.value = null
  }

  /**
   * Get transform style for visual feedback
   */
  const getTransformStyle = computed(() => {
    if (!isSwiping.value || swipeDistance.value === 0) {
      return { transform: 'translateX(0)', opacity: 1 }
    }

    const translateX = swipeDistance.value
    // Reduce opacity as card is swiped away
    const opacity = Math.max(0.3, 1 - Math.abs(swipeDistance.value) / 200)

    return {
      transform: `translateX(${translateX}px)`,
      opacity
    }
  })

  /**
   * Get swipe progress (0-1) for animations
   */
  const swipeProgress = computed(() => {
    if (!isSwiping.value || swipeDistance.value === 0) return 0
    return Math.min(1, Math.abs(swipeDistance.value) / threshold)
  })

  return {
    // State
    isSwiping: computed(() => isSwiping.value),
    swipeDistance: computed(() => swipeDistance.value),
    swipeDirection: computed(() => swipeDirection.value),
    swipeProgress,
    isTouchDevice,
    getTransformStyle,

    // Handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  }
}

