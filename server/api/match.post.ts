import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
// @ts-ignore - Server file type resolution
import type { MatchInputs, MatchSession, School, Program, ProgramType, TrustTier } from '../../types/database'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const inputs = await readBody<MatchInputs>(event)

  // Validate inputs
  if (!inputs.maxBudget || !inputs.trainingGoals || inputs.trainingGoals.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid match inputs. Budget and training goals are required.'
    })
  }

  try {
    // Create Supabase client for server-side use
    const supabaseUrl = config.public.supabaseUrl
    const supabaseAnonKey = config.public.supabaseAnonKey
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase configuration missing'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Query schools with location converted to text format for easier parsing
    // Supabase returns PostGIS geography as a string, but we need to handle it properly
    let query = supabase
      .from('schools')
      .select('*')

    // Apply basic filters
    const { data: schools, error } = await query
    
    // Log first school's location format for debugging
    if (schools && schools.length > 0) {
      console.log(`[Match API] Sample location format:`, typeof schools[0].location, schools[0].location)
    }

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch schools',
        data: error
      })
    }

    if (!schools || schools.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No schools found'
      })
    }

    console.log(`[Match API] Found ${schools.length} total schools`)
    console.log(`[Match API] Filtering with: budget=$${inputs.maxBudget}, goals=[${inputs.trainingGoals.join(', ')}]`)
    
    // Log sample school data for debugging
    if (schools.length > 0) {
      const sample = schools[0]
      console.log(`[Match API] Sample school: ${sample.name}, location: ${JSON.stringify(sample.location)}, programs: ${sample.programs?.length || 0}`)
    }

    // Filter candidate pool
    const candidates = filterCandidatePool(schools, inputs)

    console.log(`[Match API] After filtering: ${candidates.length} candidates match criteria`)

    if (candidates.length === 0) {
      // Provide comprehensive diagnostic information
      const reasons: string[] = []
      const diagnostics: any = {
        totalSchools: schools.length,
        budget: inputs.maxBudget,
        trainingGoals: inputs.trainingGoals,
        location: inputs.location
      }

      // Analyze budget constraints
      const allMinCosts = schools
        .map(s => Math.min(...(s.programs?.map((p: Program) => p.minCost) || [Infinity])))
        .filter(c => c !== Infinity)
      const minBudgetNeeded = allMinCosts.length > 0 ? Math.min(...allMinCosts) : Infinity
      const maxBudgetNeeded = allMinCosts.length > 0 ? Math.max(...allMinCosts) : 0
      
      if (minBudgetNeeded !== Infinity && inputs.maxBudget < minBudgetNeeded) {
        reasons.push(`Budget too low. Minimum program cost in database: $${minBudgetNeeded.toLocaleString()}. Try increasing budget to at least $${minBudgetNeeded.toLocaleString()}.`)
        diagnostics.minBudgetNeeded = minBudgetNeeded
      }

      // Analyze program availability
      const allProgramTypes = new Set<string>()
      schools.forEach(s => {
        s.programs?.forEach((p: Program) => allProgramTypes.add(p.type))
      })
      const availablePrograms = Array.from(allProgramTypes)
      const missingPrograms = inputs.trainingGoals.filter(g => !availablePrograms.includes(g))
      
      if (missingPrograms.length > 0) {
        reasons.push(`Programs not available: ${missingPrograms.join(', ')}. Available programs: ${availablePrograms.join(', ')}.`)
        diagnostics.availablePrograms = availablePrograms
        diagnostics.missingPrograms = missingPrograms
      }

      // Analyze location constraints
      if (inputs.location) {
        const schoolsInRadius = schools.filter(school => {
          if (!school.location) return false
          const distance = calculateDistance(
            inputs.location!.lat,
            inputs.location!.lng,
            school.location
          )
          return distance <= inputs.location!.radius
        })
        
        if (schoolsInRadius.length === 0) {
          reasons.push(`No schools within ${inputs.location.radius}km radius. Try increasing radius to 200-500km or use a different location.`)
          diagnostics.schoolsInRadius = 0
        } else {
          diagnostics.schoolsInRadius = schoolsInRadius.length
        }
      }

      // Count schools that pass each filter individually
      const budgetMatches = schools.filter(s => {
        const schoolMinCost = Math.min(...(s.programs?.map((p: Program) => p.minCost) || [Infinity]))
        return schoolMinCost <= inputs.maxBudget
      }).length

      const programMatches = schools.filter(s => {
        return inputs.trainingGoals.some((goal: ProgramType) =>
          s.programs?.some((p: Program) => p.type === goal)
        )
      }).length

      diagnostics.filterBreakdown = {
        budgetMatches,
        programMatches,
        locationMatches: inputs.location ? schools.filter(school => {
          if (!school.location) return false
          const distance = calculateDistance(
            inputs.location!.lat,
            inputs.location!.lng,
            school.location
          )
          return distance <= inputs.location!.radius
        }).length : schools.length
      }
      
      throw createError({
        statusCode: 404,
        statusMessage: `No schools match your criteria. ${reasons.length > 0 ? reasons.join(' ') : 'Try adjusting your filters.'}`,
        data: diagnostics
      })
    }

    // Call AI for ranking and debrief
    const aiResult = await callAIMatching(candidates, inputs, config.openaiApiKey)

    // Create match session
    const matchSession: MatchSession = {
      id: crypto.randomUUID(),
      inputs,
      ranked_schools: aiResult.rankedSchools,
      match_scores: aiResult.scores,
      debrief: aiResult.debrief,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      session_data: {
        candidateCount: candidates.length,
        totalSchools: schools.length
      }
    }

    return matchSession

  } catch (err) {
    console.error('Match API error:', err)
    
    // Preserve original status code if it's a createError
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }
    
    // If AI fails, return error to trigger fallback
    throw createError({
      statusCode: 500,
      statusMessage: err instanceof Error ? err.message : 'Failed to process matching',
      data: err
    })
  }
})

/**
 * Filter candidate pool based on hard constraints
 */
function filterCandidatePool(schools: School[], inputs: MatchInputs): School[] {
  return schools.filter(school => {
    // Budget constraint - at least one program must be within budget
    const schoolMinCost = Math.min(...(school.programs?.map((p: Program) => p.minCost) || [Infinity]))
    if (schoolMinCost > inputs.maxBudget) {
      return false
    }

    // Program goals match - require at least ONE matching program (not all)
    // This is more lenient since schools typically don't offer all program types
    const hasMatchingPrograms = inputs.trainingGoals.some((goal: ProgramType) =>
      school.programs?.some((p: Program) => p.type === goal)
    )
    if (!hasMatchingPrograms) {
      return false
    }

    // Location constraint (if provided)
    if (inputs.location) {
      if (!school.location) {
        // If school has no location, skip it when location filter is active
        return false
      }
      
      const distance = calculateDistance(
        inputs.location.lat,
        inputs.location.lng,
        school.location
      )
      
      // Log distance calculation for debugging
      if (isNaN(distance) || distance === Infinity) {
        console.warn(`[Match API] Invalid distance calculated for school ${school.name}, location: ${JSON.stringify(school.location)}`)
        return false
      }
      
      if (distance > inputs.location.radius) {
        return false
      }
    }

    return true
  })
}

/**
 * Call AI API for intelligent ranking and debrief
 */
async function callAIMatching(
  candidates: School[],
  inputs: MatchInputs,
  apiKey: string
): Promise<{ rankedSchools: string[]; scores: Record<string, number>; debrief: string }> {
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    // If no API key, fall back to rule-based ranking
    // This allows the app to still provide recommendations even without OpenAI
    console.log('[Match API] No OpenAI API key provided, using rule-based ranking fallback')
    return ruleBasedRanking(candidates, inputs)
  }

  try {
    const openai = new OpenAI({ apiKey })

    // Prepare school data for AI (simplified to reduce tokens)
    const schoolData = candidates.map(school => ({
      id: school.id,
      name: school.name,
      location: `${school.city}, ${school.state}`,
      programs: school.programs?.map((p: Program) => ({
        type: p.type,
        costRange: `$${p.minCost}-$${p.maxCost}`,
        hours: p.minHours
      })),
      fleet: {
        totalAircraft: school.fleet?.totalAircraft,
        hasSimulators: !!school.fleet?.simulators,
        hasG1000: school.fleet?.aircraft?.some((a: { hasG1000?: boolean }) => a.hasG1000)
      },
      trustTier: school.trust_tier,
      fspSignals: {
        avgHoursToPPL: school.fsp_signals?.avgHoursToPPL,
        fleetUtilization: school.fsp_signals?.fleetUtilization,
        passRate: school.fsp_signals?.passRateFirstAttempt
      }
    }))

    // Create AI prompt
    const prompt = `You are a flight school advisor helping a student find the best training match.

Student Requirements:
- Budget: $${inputs.maxBudget.toLocaleString()}
- Training Goals: ${inputs.trainingGoals.join(', ')}
- Schedule: ${inputs.scheduleFlexibility}
${inputs.location ? `- Location: Within ${inputs.location.radius}km radius` : ''}
${inputs.preferredAircraft ? `- Preferred Aircraft: ${inputs.preferredAircraft.join(', ')}` : ''}
${inputs.preferredTrainingType ? `- Preferred Training Type: ${inputs.preferredTrainingType}` : ''}

Candidate Schools:
${JSON.stringify(schoolData, null, 2)}

Task:
1. Rank these schools from best to worst match for this student
2. Provide a match score (0-100) for each school
3. Write a 2-3 paragraph plain-English debrief explaining:
   - Why the top school is the best match
   - Key differentiators between top 3 schools
   - Any important trade-offs or considerations

Response format (JSON):
{
  "rankings": [
    {"schoolId": "uuid", "score": 95, "reason": "brief reason"},
    ...
  ],
  "debrief": "plain English explanation..."
}

Consider: budget fit (40%), program quality (30%), location convenience (15%), fleet quality (10%), trust tier (5%)`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert flight school advisor with deep knowledge of pilot training programs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500
    })

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}')

    if (!response.rankings || !response.debrief) {
      throw new Error('Invalid AI response format')
    }

    const rankedSchools = response.rankings.map((r: any) => r.schoolId)
    const scores = response.rankings.reduce((acc: any, r: any) => {
      acc[r.schoolId] = r.score
      return acc
    }, {})

    return {
      rankedSchools,
      scores,
      debrief: response.debrief
    }

  } catch (err) {
    console.error('AI API error:', err)
    // Fall back to rule-based ranking
    return ruleBasedRanking(candidates, inputs)
  }
}

/**
 * Rule-based ranking fallback
 */
function ruleBasedRanking(
  candidates: School[],
  inputs: MatchInputs
): { rankedSchools: string[]; scores: Record<string, number>; debrief: string } {
  
  const scored = candidates.map(school => {
    let score = 0
    
    // Budget fit (40%)
    const avgCost = school.programs?.reduce((sum: number, p: Program) => sum + (p.minCost + p.maxCost) / 2, 0) || 0
    const avgProgramCost = avgCost / (school.programs?.length || 1)
    const budgetScore = Math.max(0, 1 - Math.abs(inputs.maxBudget - avgProgramCost) / inputs.maxBudget)
    score += budgetScore * 40

    // Program match (30%) - score based on how many goals match
    const matchingPrograms = inputs.trainingGoals.filter((goal: ProgramType) =>
      school.programs?.some((p: Program) => p.type === goal)
    )
    const programMatchRatio = matchingPrograms.length / inputs.trainingGoals.length
    score += programMatchRatio * 30

    // Location (15%)
    if (inputs.location && school.location) {
      const distance = calculateDistance(inputs.location.lat, inputs.location.lng, school.location)
      const locationScore = Math.max(0, 1 - distance / inputs.location.radius)
      score += locationScore * 15
    } else {
      score += 7.5 // Average score if no location preference
    }

    // Fleet quality (10%)
    const fleetScore = (school.fleet?.totalAircraft || 0) / 10
    score += Math.min(fleetScore, 1) * 10

    // Trust tier (5%)
    const tierScores: Record<TrustTier, number> = { Premier: 5, Verified: 4, Community: 2.5, Unverified: 1 }
    score += tierScores[school.trust_tier as TrustTier] || 1

    return {
      schoolId: school.id,
      schoolName: school.name,
      score: Math.round(score)
    }
  })

  scored.sort((a, b) => b.score - a.score)

  const rankedSchools = scored.map(s => s.schoolId)
  const scores = scored.reduce((acc, s) => {
    acc[s.schoolId] = s.score
    return acc
  }, {} as Record<string, number>)

  const topSchool = scored[0]
  const secondSchool = scored[1]
  const debrief = `Based on your requirements for ${inputs.trainingGoals.join(', ')} training with a budget of $${inputs.maxBudget.toLocaleString()}, we've ranked ${scored.length} schools that meet your criteria.

Your top match, ${topSchool?.schoolName || 'the top school'}, scored ${topSchool?.score || 0}/100 based on budget compatibility, program offerings, and overall quality. ${scored.length > 1 && secondSchool ? `The next closest matches are within ${Math.abs((topSchool?.score || 0) - (secondSchool?.score || 0))} points, so we recommend comparing your top 3-5 options.` : ''}

Key factors in your decision should include: instructor availability for ${inputs.scheduleFlexibility} schedules, actual aircraft condition and availability, and the school's culture and learning environment. We recommend scheduling discovery flights or facility tours with your top choices before making a final decision.`

  return { rankedSchools, scores, debrief }
}

/**
 * Parse EWKB (Extended Well-Known Binary) hex string from PostGIS
 * Supabase returns PostGIS geography as EWKB hex strings
 */
function parseEWKB(hexString: string): { lat: number; lng: number } | null {
  try {
    // EWKB format for POINT with SRID 4326:
    // Byte 0: Endianness (01 = little endian)
    // Bytes 1-4: Geometry type (01000020 = Point with SRID)
    // Bytes 5-8: SRID (E6100000 = 4326 in little endian)
    // Bytes 9-16: X coordinate (longitude) as double
    // Bytes 17-24: Y coordinate (latitude) as double
    
    if (!hexString || hexString.length < 50) {
      return null
    }
    
    // Extract coordinate hex strings (starting after SRID, which is 9 bytes = 18 hex chars)
    const xHex = hexString.substring(18, 34) // Longitude (8 bytes = 16 hex chars)
    const yHex = hexString.substring(34, 50) // Latitude (8 bytes = 16 hex chars)
    
    if (!xHex || !yHex || xHex.length !== 16 || yHex.length !== 16) {
      return null
    }
    
    // Convert hex to double (little endian)
    const hexToDouble = (hex: string): number => {
      const bytes = new Uint8Array(8)
      for (let i = 0; i < 8; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
      }
      const view = new DataView(bytes.buffer)
      return view.getFloat64(0, true) // true = little endian
    }
    
    const lng = hexToDouble(xHex) // X = longitude
    const lat = hexToDouble(yHex) // Y = latitude
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
      return null
    }
    
    // Validate lat/lng ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null
    }
    
    return { lat, lng }
  } catch (error) {
    console.warn('[Match API] Error parsing EWKB:', error, hexString.substring(0, 50))
    return null
  }
}

/**
 * Transform location from various Supabase/PostGIS formats to {lat, lng}
 */
function transformLocation(location: any): { lat: number; lng: number } | null {
  if (!location) {
    return null
  }

  // Handle already normalized object format
  if (typeof location === 'object' && 'lat' in location && 'lng' in location) {
    const lat = Number(location.lat)
    const lng = Number(location.lng)
    if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
      return { lat, lng }
    }
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
    
    // Match POINT(lng lat) format
    const pointMatch = wktString.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
    if (pointMatch) {
      const lng = Number(pointMatch[1])
      const lat = Number(pointMatch[2])
      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        return { lat, lng }
      }
    }
    
    return null
  }

  // Handle array format: [lng, lat]
  if (Array.isArray(location) && location.length >= 2) {
    const lng = Number(location[0])
    const lat = Number(location[1])
    if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
      return { lat, lng }
    }
  }

  return null
}

/**
 * Calculate distance between two points
 */
function calculateDistance(lat1: number, lng1: number, location: any): number {
  // First transform the location to normalized format
  const coords = transformLocation(location)
  
  if (!coords) {
    console.warn(`[Match API] Failed to transform location: ${JSON.stringify(location)}`)
    return Infinity
  }
  
  const { lat: lat2, lng: lng2 } = coords

  // Validate coordinates
  if (isNaN(lat2) || isNaN(lng2) || lat2 < -90 || lat2 > 90 || lng2 < -180 || lng2 > 180) {
    console.warn(`[Match API] Invalid coordinates: lat=${lat2}, lng=${lng2}`)
    return Infinity
  }

  // Haversine formula for distance calculation
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

