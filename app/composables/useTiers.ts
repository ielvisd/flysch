import type { School, TrustTier } from '~~/types/database'

/**
 * Composable for managing trust tier logic and display
 */
export const useTiers = () => {
  /**
   * Calculate trust tier based on school signals
   */
  const calculateTier = (school: Partial<School> | null | undefined): TrustTier => {
    if (!school) return 'Unverified'
    const programCount = school.programs?.length || 0
    const utilization = school.fsp_signals?.fleetUtilization || 0
    const passRate = school.fsp_signals?.passRateFirstAttempt || 0
    const satisfaction = school.fsp_signals?.studentSatisfaction || 0

    // Premier: High performance across all metrics
    if (
      utilization > 75 && 
      programCount >= 3 && 
      passRate > 85 &&
      satisfaction >= 4.0
    ) {
      return 'Premier'
    }

    // Verified: Good performance in key areas
    if (
      (programCount >= 3 || utilization > 70) &&
      (passRate > 75 || satisfaction >= 3.5)
    ) {
      return 'Verified'
    }

    // Community: Basic criteria met
    if (programCount >= 2 || utilization > 60) {
      return 'Community'
    }

    return 'Unverified'
  }

  /**
   * Get tier color for UI display
   */
  const getTierColor = (tier: TrustTier): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' => {
    const colors: Record<TrustTier, 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
      'Premier': 'warning',
      'Verified': 'success',
      'Community': 'primary',
      'Unverified': 'neutral'
    }
    return colors[tier] || 'neutral'
  }

  /**
   * Get tier icon
   */
  const getTierIcon = (tier: TrustTier): string => {
    const icons: Record<TrustTier, string> = {
      'Premier': 'i-heroicons-star-solid',
      'Verified': 'i-heroicons-check-badge-solid',
      'Community': 'i-heroicons-user-group-solid',
      'Unverified': 'i-heroicons-question-mark-circle'
    }
    return icons[tier] || 'i-heroicons-question-mark-circle'
  }

  /**
   * Get tier description
   */
  const getTierDescription = (tier: TrustTier): string => {
    const descriptions: Record<TrustTier, string> = {
      'Premier': 'Top-performing school with verified excellence across all metrics',
      'Verified': 'Established school with verified performance data',
      'Community': 'Community-reviewed school with basic verification',
      'Unverified': 'Limited performance data available'
    }
    return descriptions[tier] || ''
  }

  /**
   * Get verification criteria for a tier
   */
  const getTierCriteria = (tier: TrustTier): string[] => {
    const criteria: Record<TrustTier, string[]> = {
      'Premier': [
        'Fleet utilization above 75%',
        'Offers 3+ training programs',
        'First-attempt pass rate above 85%',
        'Student satisfaction rating 4.0+',
        'Independently verified data'
      ],
      'Verified': [
        'Offers multiple training programs',
        'Good fleet utilization (70%+)',
        'Solid pass rates or student satisfaction',
        'Some verified performance data'
      ],
      'Community': [
        'Offers at least 2 programs',
        'Reasonable fleet utilization',
        'Community feedback available'
      ],
      'Unverified': [
        'Basic listing information',
        'Limited performance data',
        'Not yet independently verified'
      ]
    }
    return criteria[tier] || []
  }

  /**
   * Format tier badge with proper styling
   */
  const getTierBadge = (tier: TrustTier): { 
    label: TrustTier; 
    color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'; 
    icon: string 
  } => {
    return {
      label: tier,
      color: getTierColor(tier),
      icon: getTierIcon(tier)
    }
  }

  /**
   * Check if school meets tier requirements
   */
  const meetsTierRequirements = (school: Partial<School> | null | undefined, targetTier: TrustTier): boolean => {
    if (!school) return false
    const currentTier = calculateTier(school)
    const tierRanking = {
      'Premier': 4,
      'Verified': 3,
      'Community': 2,
      'Unverified': 1
    }
    
    return tierRanking[currentTier] >= tierRanking[targetTier]
  }

  /**
   * Get next tier recommendations
   */
  const getNextTierRecommendations = (school: Partial<School> | null | undefined): string[] => {
    if (!school) return []
    const currentTier = calculateTier(school)
    const recommendations: string[] = []
    
    const programCount = school.programs?.length || 0
    const utilization = school.fsp_signals?.fleetUtilization || 0
    const passRate = school.fsp_signals?.passRateFirstAttempt || 0
    const satisfaction = school.fsp_signals?.studentSatisfaction || 0

    if (currentTier === 'Unverified') {
      if (programCount < 2) recommendations.push('Add more training programs')
      if (utilization < 60) recommendations.push('Improve fleet utilization')
    }
    
    if (currentTier === 'Community') {
      if (programCount < 3) recommendations.push('Expand program offerings')
      if (utilization < 70) recommendations.push('Increase fleet utilization to 70%+')
      if (passRate < 75) recommendations.push('Work on improving pass rates')
    }
    
    if (currentTier === 'Verified') {
      if (utilization <= 75) recommendations.push('Achieve 75%+ fleet utilization')
      if (programCount < 3) recommendations.push('Offer at least 3 programs')
      if (passRate <= 85) recommendations.push('Improve first-attempt pass rate to 85%+')
      if (satisfaction < 4.0) recommendations.push('Increase student satisfaction to 4.0+')
    }

    return recommendations
  }

  return {
    calculateTier,
    getTierColor,
    getTierIcon,
    getTierDescription,
    getTierCriteria,
    getTierBadge,
    meetsTierRequirements,
    getNextTierRecommendations
  }
}

