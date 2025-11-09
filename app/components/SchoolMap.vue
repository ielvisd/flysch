<template>
  <div ref="mapContainer" class="map-container w-full h-full rounded-lg overflow-hidden" :class="containerClass"></div>
</template>

<script setup lang="ts">
import type { School } from '~~/types/database'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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
let map: L.Map | null = null
let markers: L.Marker[] = []
let radiusCircle: L.Circle | null = null
let userMarker: L.Marker | null = null

// Fix Leaflet default icon issue
if (process.client) {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
  })
}

// Create custom icon for schools
const createSchoolIcon = (tier: string) => {
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
onMounted(() => {
  if (!mapContainer.value || !process.client) return

  const center = effectiveCenter.value

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

  // Add school markers
  updateMarkers()

  // Fit bounds if schools are provided
  if (props.schools.length > 0 || props.singleSchool) {
    fitBounds()
  }
})

// Update markers when schools change
watch(() => props.schools, () => {
  if (map) {
    updateMarkers()
    fitBounds()
  }
}, { deep: true })

watch(() => props.singleSchool, () => {
  if (map) {
    updateMarkers()
    if (props.singleSchool) {
      fitBounds()
    }
  }
})

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
  if (!map) return

  // Clear existing markers
  markers.forEach(marker => map!.removeLayer(marker))
  markers = []

  const schoolsToShow = props.singleSchool ? [props.singleSchool] : props.schools

  schoolsToShow.forEach((school) => {
    if (!school.location) return

    const location = parseLocation(school.location)
    if (!location) return

    const icon = createSchoolIcon(school.trust_tier || 'Unverified')
    const marker = L.marker([location.lat, location.lng], { icon })
      .addTo(map!)
      .bindPopup(createPopupContent(school))

    markers.push(marker)
  })
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

// Parse location from various formats
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

// Fit map bounds to show all markers
const fitBounds = () => {
  if (!map) return

  const schoolsToShow = props.singleSchool ? [props.singleSchool] : props.schools
  const bounds: L.LatLngExpression[] = []

  schoolsToShow.forEach((school) => {
    if (!school.location) return
    const location = parseLocation(school.location)
    if (location) {
      bounds.push([location.lat, location.lng] as L.LatLngTuple)
    }
  })

  // Include user location if showing radius
  if (props.showRadius && effectiveCenter.value) {
    const center = effectiveCenter.value
    bounds.push([center.lat, center.lng] as L.LatLngTuple)
  }

  if (bounds.length > 0) {
    if (bounds.length === 1) {
      // Single point - set zoom level
      map.setView(bounds[0] as L.LatLngTuple, props.singleSchool ? 12 : 10)
    } else {
      map.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]), { padding: [50, 50], maxZoom: 15 })
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

