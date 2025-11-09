export default defineAppConfig({
  ui: {
    primary: 'blue',
    gray: 'slate',
    colors: {
      primary: {
        50: '#E6F0F7',
        100: '#B3D1E8',
        200: '#80B2D9',
        300: '#4D93CA',
        400: '#1A74BB',
        500: '#1A659E', // Medium blue - primary actions
        600: '#004E89', // Dark blue - headers, main elements
        700: '#003D6B',
        800: '#002C4D',
        900: '#001B2F',
        950: '#000A15'
      } as any,
      secondary: {
        50: '#FFF5F0',
        100: '#FFE0D1',
        200: '#FFCBB2',
        300: '#FFB693',
        400: '#FFA174',
        500: '#FF6B35', // Orange - CTAs and accents
        600: '#E65A2A',
        700: '#CC491F',
        800: '#B33814',
        900: '#992709',
        950: '#801600'
      } as any,
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
      } as any,
      error: {
        50: '#FFF5F0',
        100: '#FFE0D1',
        200: '#FFCBB2',
        300: '#FFB693',
        400: '#FFA174',
        500: '#FF6B35', // Orange - important actions
        600: '#E65A2A',
        700: '#CC491F',
        800: '#B33814',
        900: '#992709',
        950: '#801600'
      } as any
    },
    notifications: {
      position: 'top-0 right-0'
    },
    button: {
      slots: {
        base: 'rounded-lg font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors'
      },
      defaultVariants: {
        size: 'md',
        color: 'primary'
      }
    } as any,
    card: {
      slots: {
        root: 'rounded-xl overflow-hidden',
        header: 'rounded-t-xl',
        footer: 'rounded-b-xl'
      },
      defaultVariants: {
        variant: 'outline'
      }
    } as any,
    badge: {
      slots: {
        base: 'rounded-full'
      },
      variants: {
        solid: {
          base: 'bg-{color}-500 text-white'
        },
        outline: {
          base: 'border border-{color}-500 text-{color}-600 dark:text-{color}-400'
        }
      }
    } as any,
    input: {
      slots: {
        base: 'rounded-lg'
      },
      defaultVariants: {
        variant: 'outline',
        size: 'md'
      },
      variants: {
        outline: {
          base: 'border-2 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 rounded-lg'
        }
      }
    }
  }
})

