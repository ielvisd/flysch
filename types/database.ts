// Database types for Flysch

export type TrustTier = 'Premier' | 'Verified' | 'Community' | 'Unverified'

export type TrainingType = 'Part 61' | 'Part 141'

export type ProgramType = 'PPL' | 'IR' | 'CPL' | 'CFI' | 'CFII' | 'MEI' | 'ATP'

export interface Program {
  type: ProgramType
  minCost: number
  maxCost: number
  inclusions: string[]  // e.g., ['aircraft', 'materials', 'instructor', 'checkride']
  minHours: {
    part61?: number
    part141?: number
  }
  maxHours?: {
    part61?: number
    part141?: number
  }
  minMonths?: number
  maxMonths?: number
  trainingType: TrainingType[]
  description?: string
}

export interface Aircraft {
  type: string  // e.g., 'Cessna 172', 'Piper PA-28'
  count: number
  hasG1000?: boolean
  hourlyRate?: number
}

export interface Fleet {
  aircraft: Aircraft[]
  simulators?: {
    count: number
    types: string[]
  }
  totalAircraft?: number
}

export interface FSPSignals {
  avgHoursToPPL?: number
  avgHoursToIR?: number
  avgHoursToCPL?: number
  cancellationRate?: number  // Percentage
  fleetUtilization?: number  // Percentage
  studentSatisfaction?: number  // 1-5 scale
  passRateFirstAttempt?: number  // Percentage
  avgTimeToComplete?: number  // Months
}

export interface School {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  } | null
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  programs: Program[]
  fleet: Fleet
  instructors_count: number
  trust_tier: TrustTier
  fsp_signals: FSPSignals
  verified_at?: string
  claimed_by?: string
  website?: string
  phone?: string
  email?: string
  created_at: string
  updated_at: string
}

export type UserRole = 'student' | 'school' | 'admin'

export interface UserProfile {
  id: string
  role: UserRole
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type InquiryType = 'inquiry' | 'tour' | 'discovery_flight'

export type InquiryStatus = 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'

export interface Inquiry {
  id: string
  school_id: string
  user_id?: string
  type: InquiryType
  status: InquiryStatus
  message?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  preferred_date?: string
  created_at: string
  updated_at: string
}

export interface MatchInputs {
  maxBudget: number
  trainingGoals: ProgramType[]
  preferredAircraft?: string[]
  scheduleFlexibility: 'full-time' | 'part-time' | 'weekends' | 'evenings'
  location: {
    lat: number
    lng: number
    radius: number  // in km
  }
  financing?: boolean
  veteranBenefits?: boolean
  housingNeeded?: boolean
  preferredTrainingType?: TrainingType
}

export interface MatchSession {
  id: string
  user_id?: string
  session_data: Record<string, any>
  inputs: MatchInputs
  ranked_schools: string[]  // Array of school IDs
  match_scores: Record<string, number>  // school_id -> score
  debrief: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// Filter types for search
export interface SchoolFilters {
  search?: string
  programs?: ProgramType[]
  budgetMin?: number
  budgetMax?: number
  trainingType?: TrainingType[]
  location?: {
    lat: number
    lng: number
    radius: number  // in km
  }
  trustTiers?: TrustTier[]
  hasSimulator?: boolean
  hasG1000?: boolean
  financing?: boolean
  veteranBenefits?: boolean
}

// Geo types
export interface GeoPoint {
  lat: number
  lng: number
}

export interface GeoFilter extends GeoPoint {
  radius: number  // in km
}

