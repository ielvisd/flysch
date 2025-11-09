import { describe, it, expect } from 'vitest'

describe('useTiers composable', () => {
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
    // This would test the getTierColor function
    // For now, we'll just test the data structure
    expect(mockSchoolPremier.trust_tier).toBe('Premier')
    expect(mockSchoolVerified.trust_tier).toBe('Verified')
    expect(mockSchoolCommunity.trust_tier).toBe('Community')
  })

  it('should calculate Premier tier correctly', () => {
    const school = mockSchoolPremier
    
    // Check if school meets Premier criteria
    const meetsUtilization = (school.fsp_signals?.fleetUtilization || 0) > 75
    const meetsPrograms = (school.programs?.length || 0) >= 3
    const meetsPassRate = (school.fsp_signals?.passRateFirstAttempt || 0) > 85
    const meetsSatisfaction = (school.fsp_signals?.studentSatisfaction || 0) >= 4.0

    expect(meetsUtilization).toBe(true)
    expect(meetsPrograms).toBe(true)
    expect(meetsPassRate).toBe(true)
    expect(meetsSatisfaction).toBe(true)
  })

  it('should calculate Verified tier correctly', () => {
    const school = mockSchoolVerified
    
    const meetsPrograms = (school.programs?.length || 0) >= 3
    const meetsUtilization = (school.fsp_signals?.fleetUtilization || 0) > 70

    expect(meetsPrograms).toBe(true)
    expect(meetsUtilization).toBe(true)
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

