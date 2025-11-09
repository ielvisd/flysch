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
    
    let query = supabase
      .from('schools')
      .select('*')

    // Apply basic filters
    const { data: schools, error } = await query

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

    // Filter candidate pool
    const candidates = filterCandidatePool(schools, inputs)

    if (candidates.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No schools match your criteria. Try adjusting your filters.'
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
    // Budget constraint
    const schoolMinCost = Math.min(...(school.programs?.map((p: Program) => p.minCost) || [Infinity]))
    if (schoolMinCost > inputs.maxBudget) {
      return false
    }

    // Program goals match
    const hasRequiredPrograms = inputs.trainingGoals.every((goal: ProgramType) =>
      school.programs?.some((p: Program) => p.type === goal)
    )
    if (!hasRequiredPrograms) {
      return false
    }

    // Location constraint (if provided)
    if (inputs.location) {
      const distance = calculateDistance(
        inputs.location.lat,
        inputs.location.lng,
        school.location
      )
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

    // Program match (30%)
    const hasAllPrograms = inputs.trainingGoals.every((goal: ProgramType) =>
      school.programs?.some((p: Program) => p.type === goal)
    )
    score += (hasAllPrograms ? 30 : 15)

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
 * Calculate distance between two points
 */
function calculateDistance(lat1: number, lng1: number, location: any): number {
  // Parse location if it's in PostGIS format
  let lat2: number, lng2: number

  if (typeof location === 'string' && location.startsWith('POINT(')) {
    const coords = location.match(/POINT\(([^)]+)\)/)
    if (coords && coords[1]) {
      const parts = coords[1].split(' ').map(Number)
      if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined && !isNaN(parts[0]) && !isNaN(parts[1])) {
        lng2 = parts[0]
        lat2 = parts[1]
      } else {
        return Infinity
      }
    } else {
      return Infinity
    }
  } else if (typeof location === 'object' && 'lat' in location) {
    lat2 = location.lat
    lng2 = location.lng
  } else {
    return Infinity
  }

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

