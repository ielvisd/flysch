import type { School, SchoolFilters, Program } from '~~/types/database'

/**
 * Composable for managing school data and queries
 */
export const useSchools = () => {
  const nuxtApp = useNuxtApp()
  const $supabase = nuxtApp.$supabase as any // Type assertion for Supabase client
  const toast = useToast()
  
  // Global state for caching schools
  const schoolsCache = useState<School[]>('schools-cache', () => [])
  const loading = useState<boolean>('schools-loading', () => false)
  const error = useState<Error | null>('schools-error', () => null)

  /**
   * Fetch schools with filters
   */
  const fetchSchools = async (filters?: SchoolFilters) => {
    loading.value = true
    error.value = null

    try {
      if (!$supabase) {
        const errorMsg = 'Supabase client not initialized. Schools are stored in the database. Please:\n1. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file\n2. Run the seed endpoint (/api/seed) to populate schools data'
        console.error(errorMsg)
        toast.add({
          title: 'Database Connection Required',
          description: 'Schools are stored in Supabase. Please configure your environment variables and seed the database.',
          color: 'error',
          timeout: 10000
        })
        throw new Error(errorMsg)
      }

      let query = $supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true })

      // Apply text search
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      // Apply budget filter
      if (filters?.budgetMin || filters?.budgetMax) {
        // This would require a more complex query on JSONB
        // For now, we'll fetch all and filter client-side
      }

      // Apply trust tier filter
      if (filters?.trustTiers && filters.trustTiers.length > 0) {
        query = query.in('trust_tier', filters.trustTiers)
      }

      // Execute query
      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      let results = data || []

      // Apply geo-filter if provided
      if (filters?.location) {
        results = filterByLocation(results, filters.location)
      }

      // Apply program filter
      if (filters?.programs && filters.programs.length > 0) {
        results = results.filter((school: School) => 
          school.programs.some((p: Program) => filters.programs?.includes(p.type))
        )
      }

      // Apply budget filter client-side (more accurate with program data)
      if (filters?.budgetMin || filters?.budgetMax) {
        results = results.filter((school: School) => {
          return school.programs.some((program: Program) => {
            const min = filters.budgetMin || 0
            const max = filters.budgetMax || Infinity
            return program.minCost >= min && program.maxCost <= max
          })
        })
      }

      // Apply fleet filters
      if (filters?.hasSimulator) {
        results = results.filter((school: School) => school.fleet?.simulators)
      }

      if (filters?.hasG1000) {
        results = results.filter((school: School) => 
          school.fleet?.aircraft?.some((a: { hasG1000?: boolean }) => a.hasG1000)
        )
      }

      schoolsCache.value = results
      return results

    } catch (err) {
      console.error('Error fetching schools:', err)
      error.value = err as Error
      toast.add({
        title: 'Error Loading Schools',
        description: 'Failed to load flight schools. Please try again.',
        color: 'error'
      })
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single school by ID
   */
  const fetchSchool = async (id: string): Promise<School | null> => {
    loading.value = true
    error.value = null

    try {
      if (!$supabase) {
        const errorMsg = 'Supabase client not initialized. Please check your environment variables.'
        console.error(errorMsg)
        throw new Error(errorMsg)
      }

      const { data, error: fetchError } = await $supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return data
    } catch (err) {
      console.error('Error fetching school:', err)
      error.value = err as Error
      toast.add({
        title: 'School Not Found',
        description: 'The requested school could not be found.',
        color: 'error'
      })
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Subscribe to real-time updates for a school
   */
  const subscribeToSchool = (schoolId: string, callback: (school: School) => void) => {
    if (!$supabase) {
      console.error('Supabase client not initialized')
      return () => {}
    }

    const channel = $supabase
      .channel(`school:${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'schools',
          filter: `id=eq.${schoolId}`
        },
        (payload: { new: School }) => {
          callback(payload.new as School)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  /**
   * Filter schools by geographic location
   */
  const filterByLocation = (schools: School[], location: { lat: number; lng: number; radius: number }) => {
    return schools.filter((school: School) => {
      if (!school.location) return false
      
      // Parse PostGIS POINT format
      const point = parseLocation(school.location)
      if (!point) return false

      const distance = calculateDistance(
        location.lat,
        location.lng,
        point.lat,
        point.lng
      )

      return distance <= location.radius
    })
  }

  /**
   * Parse location from various formats
   */
  const parseLocation = (location: any): { lat: number; lng: number } | null => {
    if (!location) return null

    // Handle PostGIS geography format
    if (typeof location === 'string' && location.startsWith('POINT(')) {
      const coords = location.match(/POINT\(([^)]+)\)/)
      if (coords && coords[1]) {
        const parts = coords[1].split(' ').map(Number)
        if (parts.length >= 2) {
          const lng = parts[0]
          const lat = parts[1]
          if (lng !== undefined && lat !== undefined && !isNaN(lng) && !isNaN(lat)) {
            return { lat, lng }
          }
        }
      }
    }

    // Handle object format
    if (typeof location === 'object' && 'lat' in location && 'lng' in location) {
      return { lat: location.lat, lng: location.lng }
    }

    return null
  }

  /**
   * Calculate distance between two points in km using Haversine formula
   */
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180)
  }

  /**
   * Search schools by text
   */
  const searchSchools = async (query: string) => {
    return fetchSchools({ search: query })
  }

  /**
   * Clear cache
   */
  const clearCache = () => {
    schoolsCache.value = []
  }

  return {
    // State
    schools: computed(() => schoolsCache.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Methods
    fetchSchools,
    fetchSchool,
    searchSchools,
    subscribeToSchool,
    filterByLocation,
    calculateDistance,
    parseLocation,
    clearCache
  }
}

