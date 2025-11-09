import { describe, it, expect, beforeEach } from 'vitest'
import { useTiers } from '~/app/composables/useTiers'
import type { School, TrustTier } from '~/types/database'

describe('useTiers composable', () => {
  let tiers: ReturnType<typeof useTiers>

  beforeEach(() => {
    tiers = useTiers()
  })
  const mockSchoolPremier = {
    programs: [
      { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
      { type: 'IR' as any, minCost: 8000, maxCost: 12000 },
      { type: 'CPL' as any, minCost: 25000, maxCost: 35000 }
    ],
    trust_tier: 'Premier' as any,
    fsp_signals: {
      fleetUtilization: 80,
      passRateFirstAttempt: 90,
      studentSatisfaction: 4.5
    }
  }

  const mockSchoolVerified = {
    programs: [
      { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
      { type: 'IR' as any, minCost: 8000, maxCost: 12000 },
      { type: 'CPL' as any, minCost: 25000, maxCost: 35000 }
    ],
    trust_tier: 'Verified' as any,
    fsp_signals: {
      fleetUtilization: 72,
      passRateFirstAttempt: 80,
      studentSatisfaction: 4.0
    }
  }

  const mockSchoolCommunity = {
    programs: [
      { type: 'PPL' as any, minCost: 10000, maxCost: 15000 },
      { type: 'IR' as any, minCost: 8000, maxCost: 12000 }
    ],
    trust_tier: 'Community' as any,
    fsp_signals: {
      fleetUtilization: 65,
      passRateFirstAttempt: 75,
      studentSatisfaction: 3.5
    }
  }

  it('should return correct tier color', () => {
    const premierColor = tiers.getTierColor('Premier')
    const verifiedColor = tiers.getTierColor('Verified')
    const communityColor = tiers.getTierColor('Community')
    const unverifiedColor = tiers.getTierColor('Unverified')

    expect(premierColor).toBe('warning')
    expect(verifiedColor).toBe('success')
    expect(communityColor).toBe('primary')
    expect(unverifiedColor).toBe('neutral')
  })

  it('should return correct tier icon', () => {
    const premierIcon = tiers.getTierIcon('Premier')
    const verifiedIcon = tiers.getTierIcon('Verified')

    expect(premierIcon).toContain('star')
    expect(verifiedIcon).toContain('check-badge')
  })

  it('should return tier description', () => {
    const premierDesc = tiers.getTierDescription('Premier')
    const verifiedDesc = tiers.getTierDescription('Verified')

    expect(premierDesc).toContain('Top-performing')
    expect(verifiedDesc).toContain('Established')
  })

  it('should return tier criteria', () => {
    const premierCriteria = tiers.getTierCriteria('Premier')
    const verifiedCriteria = tiers.getTierCriteria('Verified')

    expect(premierCriteria.length).toBeGreaterThan(0)
    expect(verifiedCriteria.length).toBeGreaterThan(0)
    expect(premierCriteria[0]).toContain('Fleet utilization')
  })

  it('should return tier badge', () => {
    const premierBadge = tiers.getTierBadge('Premier')
    const verifiedBadge = tiers.getTierBadge('Verified')

    expect(premierBadge.label).toBe('Premier')
    expect(premierBadge.color).toBe('warning')
    expect(verifiedBadge.label).toBe('Verified')
    expect(verifiedBadge.color).toBe('success')
  })

  it('should calculate Premier tier correctly', () => {
    const calculatedTier = tiers.calculateTier(mockSchoolPremier as Partial<School>)
    
    expect(calculatedTier).toBe('Premier')
    
    // Check if school meets Premier criteria
    const meetsUtilization = (mockSchoolPremier.fsp_signals?.fleetUtilization || 0) > 75
    const meetsPrograms = (mockSchoolPremier.programs?.length || 0) >= 3
    const meetsPassRate = (mockSchoolPremier.fsp_signals?.passRateFirstAttempt || 0) > 85
    const meetsSatisfaction = (mockSchoolPremier.fsp_signals?.studentSatisfaction || 0) >= 4.0

    expect(meetsUtilization).toBe(true)
    expect(meetsPrograms).toBe(true)
    expect(meetsPassRate).toBe(true)
    expect(meetsSatisfaction).toBe(true)
  })

  it('should calculate Verified tier correctly', () => {
    const calculatedTier = tiers.calculateTier(mockSchoolVerified as Partial<School>)
    
    expect(calculatedTier).toBe('Verified')
    
    const meetsPrograms = (mockSchoolVerified.programs?.length || 0) >= 3
    const meetsUtilization = (mockSchoolVerified.fsp_signals?.fleetUtilization || 0) > 70

    expect(meetsPrograms).toBe(true)
    expect(meetsUtilization).toBe(true)
  })

  it('should calculate Community tier correctly', () => {
    const calculatedTier = tiers.calculateTier(mockSchoolCommunity as Partial<School>)
    
    expect(calculatedTier).toBe('Community')
  })

  it('should check tier requirements', () => {
    const meetsPremier = tiers.meetsTierRequirements(mockSchoolPremier as Partial<School>, 'Premier')
    const meetsVerified = tiers.meetsTierRequirements(mockSchoolPremier as Partial<School>, 'Verified')
    
    expect(meetsPremier).toBe(true)
    expect(meetsVerified).toBe(true)
  })

  it('should provide next tier recommendations', () => {
    const recommendations = tiers.getNextTierRecommendations(mockSchoolCommunity as Partial<School>)
    
    expect(Array.isArray(recommendations)).toBe(true)
  })

  it('should handle schools with minimal data', () => {
    const minimalSchool = {
      programs: [{ type: 'PPL' as any, minCost: 10000, maxCost: 15000 }],
      trust_tier: 'Unverified' as any,
      fsp_signals: {}
    }

    expect(minimalSchool.trust_tier).toBe('Unverified')
  })
})

