export default defineAppConfig({
  ui: {
    primary: 'blue',
    gray: 'slate',
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#1e40af', // Main sky blue
        700: '#1e3a8a',
        800: '#1e3a8a',
        900: '#1e3a8a',
        950: '#172554'
      },
      secondary: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b', // Runway orange
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        950: '#451a03'
      },
      success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#10b981', // Verified green
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
        950: '#022c22'
      }
    },
    notifications: {
      position: 'top-0 right-0'
    },
    button: {
      default: {
        size: 'md',
        color: 'primary'
      }
    },
    card: {
      rounded: 'rounded-lg',
      shadow: 'shadow-md',
      divide: 'divide-gray-200 dark:divide-gray-800'
    },
    badge: {
      rounded: 'rounded-full',
      variant: {
        solid: 'bg-{color}-500 text-white',
        outline: 'border border-{color}-500 text-{color}-600 dark:text-{color}-400'
      }
    },
    container: {
      constrained: 'max-w-7xl'
    }
  }
})

