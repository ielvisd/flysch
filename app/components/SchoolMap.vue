<template>
  <div ref="mapContainer" class="map-container w-full h-full rounded-lg overflow-hidden" :class="containerClass"></div>
</template>

<script setup lang="ts">
import type { School } from '~~/types/database'

interface Props {
  schools?: School[]
  center?: { lat: number; lng: number }
  zoom?: number
  radius?: number // in km
  showRadius?: boolean
  singleSchool?: School
  containerClass?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  schools: () => [],
  center: () => ({ lat: 39.8283, lng: -98.5795 }), // Center of USA
  zoom: 4,
  radius: 100,
  showRadius: false,
  containerClass: '',
  height: '400px'
})

const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let markers: any[] = []
let radiusCircle: any = null
let userMarker: any = null
let L: any = null

// Create custom icon for schools
const createSchoolIcon = (tier: string) => {
  if (!L) return null
  
  const colors: Record<string, string> = {
    'Premier': '#F59E0B',
    'Verified': '#10B981',
    'Community': '#1A659E',
    'Unverified': '#6B7280'
  }
  const color = colors[tier] || '#6B7280'
  
  return L.divIcon({
    className: 'school-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      ">✈️</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

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

// Parse location from various formats (enhanced to handle all Supabase/PostGIS formats)
const parseLocation = (location: any): { lat: number; lng: number } | null => {
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
    }
    
    // Remove SRID prefix if present
    let wktString = location.replace(/^SRID=\d+;/, '')
    
    // Match POINT(lng lat) format (case insensitive, with optional whitespace)
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

// Get effective center
const effectiveCenter = computed(() => {
  if (props.singleSchool) {
    const location = parseLocation(props.singleSchool.location)
    if (location) {
      return { lat: location.lat, lng: location.lng }
    }
  }
  return props.center
})

// Initialize map
onMounted(async () => {
  if (!mapContainer.value || !process.client) {
    console.debug('Map container not available or not on client')
    return
  }

  // Dynamically import Leaflet only on client side
  try {
    const leafletModule = await import('leaflet')
    L = leafletModule.default
    await import('leaflet/dist/leaflet.css')
    
    // Fix Leaflet default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    })
  } catch (error) {
    console.error('Failed to load Leaflet:', error)
    return
  }

  const center = effectiveCenter.value
  console.debug('Initializing map with center:', center, 'schools count:', props.schools?.length || 0)

  // Initialize map
  map = L.map(mapContainer.value, {
    center: [center.lat, center.lng],
    zoom: props.zoom,
    zoomControl: true,
    attributionControl: true
  })

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  // Add user location marker if center is provided and showing radius
  if (center && props.showRadius) {
    userMarker = L.marker([center.lat, center.lng], {
      icon: L.divIcon({
        className: 'user-marker',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: #FF6B35;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(map)
    userMarker.bindPopup('<b>Your Location</b>').openPopup()

    // Add radius circle
    if (props.radius) {
      radiusCircle = L.circle([center.lat, center.lng], {
        radius: props.radius * 1000, // Convert km to meters
        color: '#1A659E',
        fillColor: '#1A659E',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map)
    }
  }

  // Wait a tick to ensure map is fully initialized
  nextTick(() => {
    // Check if map container is still in DOM
    if (!map || !map.getContainer() || !map.getContainer().parentElement) {
      console.debug('Map container not ready, skipping initialization')
      return
    }
    
    // Add school markers
    updateMarkers()

    // Fit bounds if schools are provided
    if ((props.schools && props.schools.length > 0) || props.singleSchool) {
      // Use another nextTick to ensure markers are added
      nextTick(() => {
        if (map && map.getContainer() && map.getContainer().parentElement) {
          fitBounds()
        }
      })
    }
    
    console.debug('Map initialized with', props.schools?.length || 0, 'schools')
  })
})

// Update markers when schools change
watch(() => props.schools, (newSchools, oldSchools) => {
  if (!map) {
    console.debug('Map not initialized, skipping marker update on schools change')
    return
  }
  
  // Check if map container is still in DOM
  if (!map.getContainer() || !map.getContainer().parentElement) {
    console.debug('Map container not in DOM, skipping update')
    return
  }
  
  console.debug('Schools prop changed:', {
    oldCount: oldSchools?.length || 0,
    newCount: newSchools?.length || 0
  })
  
  updateMarkers()
  
  // Only fit bounds if there are schools to show
  if (newSchools && newSchools.length > 0) {
    // Use nextTick to ensure map is ready after DOM updates
    nextTick(() => {
      if (map && map.getContainer() && map.getContainer().parentElement) {
        fitBounds()
      }
    })
  }
}, { deep: true, immediate: false })

watch(() => props.singleSchool, (newSchool, oldSchool) => {
  if (!map) {
    console.debug('Map not initialized, skipping marker update on singleSchool change')
    return
  }
  
  console.debug('SingleSchool prop changed:', {
    oldId: oldSchool?.id,
    newId: newSchool?.id
  })
  
  updateMarkers()
  if (props.singleSchool) {
    fitBounds()
  }
}, { deep: true })

watch(() => [effectiveCenter.value, props.radius], () => {
  if (map && props.showRadius) {
    const center = effectiveCenter.value
    // Update user marker
    if (userMarker) {
      userMarker.setLatLng([center.lat, center.lng])
      map.setView([center.lat, center.lng], map.getZoom())
    }

    // Update radius circle
    if (radiusCircle && props.radius) {
      radiusCircle.setLatLng([center.lat, center.lng])
      radiusCircle.setRadius(props.radius * 1000)
    }
  }
})

// Update markers
const updateMarkers = () => {
  if (!map) {
    console.debug('Map not initialized, skipping marker update')
    return
  }

  // Clear existing markers
  markers.forEach(marker => map!.removeLayer(marker))
  markers = []

  const schoolsToShow = props.singleSchool ? [props.singleSchool] : props.schools

  if (!schoolsToShow || schoolsToShow.length === 0) {
    console.debug('No schools to display on map')
    return
  }

  console.debug(`Updating markers for ${schoolsToShow.length} school(s)`)
  console.debug('Schools data:', schoolsToShow.map(s => ({
    id: s.id,
    name: s.name,
    location: s.location,
    locationType: typeof s.location
  })))

  let markersCreated = 0
  let markersSkipped = 0

  schoolsToShow.forEach((school) => {
    if (!school.location) {
      console.debug(`School ${school.name || school.id} has no location data`)
      markersSkipped++
      return
    }

    const location = parseLocation(school.location)
    if (!location) {
      console.warn(`Failed to parse location for school ${school.name || school.id}:`, school.location)
      markersSkipped++
      return
    }

    // Validate coordinates are within valid ranges
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      console.warn(`Invalid coordinates for school ${school.name || school.id}:`, location)
      markersSkipped++
      return
    }

    try {
      const icon = createSchoolIcon(school.trust_tier || 'Unverified')
      if (!icon || !L) {
        console.warn(`Cannot create marker - Leaflet not loaded for school ${school.name || school.id}`)
        markersSkipped++
        return
      }
      const marker = L.marker([location.lat, location.lng], { icon })
        .addTo(map!)
        .bindPopup(createPopupContent(school))

      markers.push(marker)
      markersCreated++
    } catch (error) {
      console.error(`Error creating marker for school ${school.name || school.id}:`, error)
      markersSkipped++
    }
  })

  console.debug(`Markers created: ${markersCreated}, skipped: ${markersSkipped}`)
}

// Create popup content
const createPopupContent = (school: School): string => {
  const costRange = school.programs && school.programs.length > 0
    ? (() => {
        const costs = school.programs.flatMap(p => [p.minCost, p.maxCost])
        const min = Math.min(...costs)
        const max = Math.max(...costs)
        return `$${min.toLocaleString()} - $${max.toLocaleString()}`
      })()
    : 'N/A'

  return `
    <div style="min-width: 200px;">
      <h3 style="font-weight: bold; margin-bottom: 8px; color: #004E89;">${school.name}</h3>
      <p style="margin: 4px 0; color: #6B7280; font-size: 12px;">
        📍 ${school.city}, ${school.state}
      </p>
      <p style="margin: 4px 0; color: #6B7280; font-size: 12px;">
        💰 ${costRange}
      </p>
      <p style="margin: 4px 0; color: #6B7280; font-size: 12px;">
        🛡️ ${school.trust_tier || 'Unverified'}
      </p>
      <a href="/schools/${school.id}" style="
        display: inline-block;
        margin-top: 8px;
        padding: 4px 12px;
        background-color: #FF6B35;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      ">View Details</a>
    </div>
  `
}

// Fit map bounds to show all markers
const fitBounds = () => {
  if (!map || !L) return
  
  // Check if map container is still in DOM
  const container = map.getContainer()
  if (!container || !container.parentElement) {
    console.debug('Map container not in DOM, skipping fitBounds')
    return
  }

  const schoolsToShow = props.singleSchool ? [props.singleSchool] : props.schools
  
  // Early return if no schools to show
  if (!schoolsToShow || schoolsToShow.length === 0) {
    return
  }
  
  const bounds: [number, number][] = []

  schoolsToShow.forEach((school) => {
    if (!school.location) return
    const location = parseLocation(school.location)
    if (location) {
      // Validate coordinates before adding to bounds
      if (isFinite(location.lat) && isFinite(location.lng) &&
          location.lat >= -90 && location.lat <= 90 &&
          location.lng >= -180 && location.lng <= 180) {
        bounds.push([location.lat, location.lng])
      } else {
        console.warn(`Invalid coordinates for school ${school.name || school.id}:`, location)
      }
    }
  })

  // Include user location if showing radius
  if (props.showRadius && effectiveCenter.value) {
    const center = effectiveCenter.value
    if (isFinite(center.lat) && isFinite(center.lng) &&
        center.lat >= -90 && center.lat <= 90 &&
        center.lng >= -180 && center.lng <= 180) {
      bounds.push([center.lat, center.lng])
    }
  }

  if (bounds.length > 0 && L) {
    try {
      // Double-check map is still valid before manipulating
      if (!map.getContainer() || !map.getContainer().parentElement) {
        return
      }
      
      if (bounds.length === 1) {
        // Single point - set zoom level
        map.setView(bounds[0] as any, props.singleSchool ? 12 : 10)
      } else {
        const latLngBounds = L.latLngBounds(bounds as any)
        // Validate bounds are valid (not infinite or NaN)
        if (latLngBounds.isValid()) {
          map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 15 })
        } else {
          console.warn('Invalid bounds calculated, using default view')
          map.setView([39.8283, -98.5795], 4) // Center of USA
        }
      }
    } catch (error) {
      console.error('Error fitting bounds:', error)
      // Only set view if map is still valid
      if (map.getContainer() && map.getContainer().parentElement) {
        map.setView([39.8283, -98.5795], 4) // Fallback to center of USA
      }
    }
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  markers = []
  radiusCircle = null
  userMarker = null
})
</script>

<style scoped>
.map-container {
  min-height: 400px;
  z-index: 0;
}

:deep(.leaflet-container) {
  font-family: inherit;
}

:deep(.school-marker) {
  background: transparent;
  border: none;
}

:deep(.user-marker) {
  background: transparent;
  border: none;
}

@media (max-width: 768px) {
  .map-container {
    min-height: 300px;
  }
}
</style>

