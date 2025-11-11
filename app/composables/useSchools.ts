import type { School, SchoolFilters, Program } from '~~/types/database'
import { useSupabase } from './useSupabase'

/**
 * Composable for managing school data and queries
 */
export const useSchools = () => {
  const toast = useToast()
  
  // Lazy initialization of Supabase client (client-side only)
  const getSupabase = () => {
    if (process.server) {
      throw new Error('Supabase operations must be performed on the client-side')
    }
    return useSupabase()
  }
  
  // Global state for caching schools with TTL
  const schoolsCache = useState<School[]>('schools-cache', () => [])
  const cacheTimestamp = useState<number>('schools-cache-timestamp', () => 0)
  const loading = useState<boolean>('schools-loading', () => false)
  const error = useState<{ message: string; code?: string } | null>('schools-error', () => null)
  
  // Cache TTL: 5 minutes
  const CACHE_TTL = 5 * 60 * 1000

  /**
   * Parse EWKB (Extended Well-Known Binary) hex string to extract coordinates
   * EWKB format: [endian(1)] [type(4)] [SRID(4)] [X(8)] [Y(8)]
   * For POINT with SRID 4326: 01 01000000 E6100000 [X bytes] [Y bytes]
   */
  const parseEWKB = (hexString: string): { lat: number; lng: number } | null => {
    try {
      // Minimum length: 1 (endian) + 4 (type) + 4 (SRID) + 8 (X) + 8 (Y) = 25 bytes = 50 hex chars
      if (hexString.length < 50) {
        console.warn('EWKB string too short:', hexString.length)
        return null
      }
      
      // Check endianness (should be 01 for little endian)
      if (hexString.substring(0, 2) !== '01') {
        console.warn('EWKB not little endian:', hexString.substring(0, 2))
        return null
      }
      
      // Extract coordinate hex strings
      // Skip: 1 byte (endian) + 4 bytes (type) + 4 bytes (SRID) = 9 bytes = 18 hex chars
      // X coordinate: bytes 9-16 (18 hex chars starting at position 18)
      // Y coordinate: bytes 17-24 (18 hex chars starting at position 34)
      const xHex = hexString.substring(18, 34)
      const yHex = hexString.substring(34, 50)
      
      if (!xHex || !yHex || xHex.length !== 16 || yHex.length !== 16) {
        console.warn('Invalid coordinate hex strings:', { xHex, yHex })
        return null
      }
      
      // Convert hex to double (little endian)
      const hexToDouble = (hex: string): number => {
        // Create bytes array in little-endian order
        const bytes = new Uint8Array(8)
        for (let i = 0; i < 8; i++) {
          bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
        }
        const view = new DataView(bytes.buffer)
        return view.getFloat64(0, true) // true = little endian
      }
      
      const lng = hexToDouble(xHex) // X = longitude
      const lat = hexToDouble(yHex) // Y = latitude
      
      // Validate coordinates are within valid ranges
      if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        console.warn('Invalid parsed coordinates:', { lat, lng, hexString: hexString.substring(0, 50) })
        return null
      }
      
      // Validate lat/lng ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('Coordinates out of valid range:', { lat, lng })
        return null
      }
      
      return { lat, lng }
    } catch (error) {
      console.warn('Error parsing EWKB:', error, hexString.substring(0, 50))
      return null
    }
  }

  /**
   * Transform location from various Supabase/PostGIS formats to normalized { lat, lng } format
   */
  const transformLocation = (location: any): { lat: number; lng: number } | null => {
    if (!location) {
      console.debug('Location is null or undefined')
      return null
    }

    // Handle already normalized object format
    if (typeof location === 'object' && 'lat' in location && 'lng' in location) {
      const lat = Number(location.lat)
      const lng = Number(location.lng)
      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        return { lat, lng }
      }
      console.warn('Invalid lat/lng values in location object:', location)
      return null
    }

    // Handle GeoJSON format: { type: "Point", coordinates: [lng, lat] }
    if (typeof location === 'object' && 'type' in location && location.type === 'Point' && 
        Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      const lng = Number(location.coordinates[0])
      const lat = Number(location.coordinates[1])
      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        return { lat, lng }
      }
      console.warn('Invalid coordinates in GeoJSON:', location)
      return null
    }

    // Handle PostGIS WKT format: "POINT(lng lat)" or "SRID=4326;POINT(lng lat)"
    if (typeof location === 'string') {
      // Check if it's EWKB hex format (starts with 01 and is long hex string)
      if (location.match(/^01[0-9A-Fa-f]{40,}$/)) {
        const coords = parseEWKB(location)
        if (coords) {
          return coords
        }
        // If EWKB parsing failed, continue to try other formats
      }
      
      // Remove SRID prefix if present
      let wktString = location.replace(/^SRID=\d+;/, '')
      
      // Match POINT(lng lat) format
      const pointMatch = wktString.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
      if (pointMatch) {
        const lng = Number(pointMatch[1])
        const lat = Number(pointMatch[2])
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          return { lat, lng }
        }
        console.warn('Invalid coordinates in WKT string:', location)
        return null
      }
      
      // Try to parse as comma-separated or space-separated coordinates
      const coordsMatch = wktString.match(/([-\d.]+)[,\s]+([-\d.]+)/)
      if (coordsMatch) {
        const lng = Number(coordsMatch[1])
        const lat = Number(coordsMatch[2])
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          return { lat, lng }
        }
      }
      
      console.warn('Unable to parse location string:', location.substring(0, 50))
      return null
    }

    // Handle array format: [lng, lat]
    if (Array.isArray(location) && location.length >= 2) {
      const lng = Number(location[0])
      const lat = Number(location[1])
      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        return { lat, lng }
      }
      console.warn('Invalid coordinates in array:', location)
      return null
    }

    console.warn('Unknown location format:', typeof location, location)
    return null
  }

  /**
   * Fetch schools with filters
   */
  const fetchSchools = async (filters?: SchoolFilters) => {
    if (process.server) {
      console.warn('fetchSchools cannot run on server-side')
      return []
    }
    
    // Check cache first (only if no filters or minimal filters)
    const hasFilters = filters && (
      filters.search || 
      filters.location || 
      filters.programs?.length || 
      filters.trustTiers?.length ||
      filters.trainingType?.length ||
      filters.budgetMin || 
      filters.budgetMax ||
      filters.hasSimulator ||
      filters.hasG1000
    )
    
    if (!hasFilters && schoolsCache.value.length > 0) {
      const cacheAge = Date.now() - cacheTimestamp.value
      if (cacheAge < CACHE_TTL) {
        return schoolsCache.value
      }
    }
    
    loading.value = true
    error.value = null

    try {
      const supabase = getSupabase()
      
      // Use RPC to extract coordinates from PostGIS geography, or fallback to regular select
      // First try to get schools with extracted coordinates using raw SQL via RPC
      let query = supabase
        .from('schools')
        .select(`
          id,
          name,
          address,
          city,
          state,
          zip_code,
          country,
          programs,
          fleet,
          instructors_count,
          trust_tier,
          fsp_signals,
          verified_at,
          claimed_by,
          website,
          phone,
          email,
          created_at,
          updated_at,
          location
        `)
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

      // Transform location data after fetching to normalize PostGIS geography format
      let results = (data || []).map((school: any) => {
        const originalLocation = school.location
        const location = transformLocation(school.location)
        
        // Debug logging for location transformation
        if (!location && originalLocation) {
          console.warn(`Failed to transform location for school ${school.name || school.id}:`, {
            originalLocation,
            type: typeof originalLocation,
            isArray: Array.isArray(originalLocation),
            keys: typeof originalLocation === 'object' ? Object.keys(originalLocation) : 'N/A'
          })
        }
        
        // Ensure trust_tier always has a valid value
        const trustTier = school.trust_tier && typeof school.trust_tier === 'string' && school.trust_tier.trim() !== ''
          ? school.trust_tier
          : 'Unverified'
        
        return {
          ...school,
          location,
          trust_tier: trustTier
        }
      })
      
      console.debug(`Fetched ${results.length} schools, ${results.filter(s => s.location).length} with valid locations`)

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

      // Apply training type filter
      if (filters?.trainingType && filters.trainingType.length > 0) {
        results = results.filter((school: School) => 
          school.programs.some((p: Program) => 
            p.trainingType && filters.trainingType?.some((tt) => p.trainingType.includes(tt))
          )
        )
      }

      // Apply budget filter client-side (more accurate with program data)
      if (filters?.budgetMin || filters?.budgetMax) {
        results = results.filter((school: School) => {
          return school.programs.some((program: Program) => {
            const filterMin = filters.budgetMin || 0
            const filterMax = filters.budgetMax || Infinity
            // Check if program cost range overlaps with filter range
            // Program is in range if its min cost is within filter range OR its max cost is within filter range
            return (program.minCost >= filterMin && program.minCost <= filterMax) ||
                   (program.maxCost >= filterMin && program.maxCost <= filterMax) ||
                   (program.minCost <= filterMin && program.maxCost >= filterMax)
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

      // Update cache with results (even when filtered, so the reactive schools property updates)
      // This ensures the map component receives the filtered schools
      schoolsCache.value = results
      cacheTimestamp.value = Date.now()
      
      return results

    } catch (err) {
      console.error('Error fetching schools:', err)
      error.value = {
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        code: err instanceof Error && 'code' in err ? String(err.code) : undefined
      }
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
    if (process.server) {
      console.warn('fetchSchool cannot run on server-side')
      return null
    }
    
    loading.value = true
    error.value = null

    try {
      const supabase = getSupabase()
      const { data, error: fetchError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Transform location data to normalized format
      if (data) {
        data.location = transformLocation(data.location)
      }

      return data
    } catch (err) {
      console.error('Error fetching school:', err)
      error.value = {
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        code: err instanceof Error && 'code' in err ? String(err.code) : undefined
      }
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
    if (process.server) {
      console.warn('subscribeToSchool cannot run on server-side')
      return () => {}
    }
    
    const supabase = getSupabase()
    const channel = supabase
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
   * Parse location from various formats (legacy function, now uses transformLocation)
   */
  const parseLocation = (location: any): { lat: number; lng: number } | null => {
    return transformLocation(location)
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
    cacheTimestamp.value = 0
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

