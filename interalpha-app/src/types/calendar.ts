// Tipos para integração com Google Calendar

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone?: string
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  location?: string
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
  status?: 'confirmed' | 'tentative' | 'cancelled'
  visibility?: 'default' | 'public' | 'private' | 'confidential'
  colorId?: string
  recurrence?: string[]
  originalStartTime?: {
    dateTime: string
    timeZone?: string
  }
  recurringEventId?: string
  sequence?: number
  created?: string
  updated?: string
  creator?: {
    email: string
    displayName?: string
  }
  organizer?: {
    email: string
    displayName?: string
  }
}

export interface TimeSlot {
  start: Date
  end: Date
  timeZone?: string
}

export interface ConflictInfo {
  hasConflict: boolean
  conflictingEvents: CalendarEvent[]
  suggestedTimes?: TimeSlot[]
}

export interface CalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  timeZone: string
  defaultReminders: Array<{
    method: 'email' | 'popup'
    minutes: number
  }>
}

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  scope: string
  token_type: string
  expiry_date: number
}

export interface CalendarSyncStatus {
  id: string
  userId: string
  calendarId: string
  lastSyncAt?: Date
  status: 'active' | 'paused' | 'error'
  errorMessage?: string
  syncDirection: 'import' | 'export' | 'bidirectional'
  eventCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AvailabilitySlot {
  start: Date
  end: Date
  available: boolean
  eventId?: string
  eventTitle?: string
}

export interface CalendarWebhook {
  id: string
  calendarId: string
  resourceId: string
  resourceUri: string
  token?: string
  expiration: number
  type: 'web_hook'
  address: string
}

export interface EventSyncResult {
  success: boolean
  eventId?: string
  externalId?: string
  action: 'created' | 'updated' | 'deleted' | 'skipped'
  errorMessage?: string
  timestamp: Date
}

export interface CalendarIntegration {
  id: string
  userId: string
  googleCalendarId: string
  displayName: string
  isActive: boolean
  syncEnabled: boolean
  lastSyncAt?: Date
  tokens: GoogleTokens
  webhookId?: string
  config: {
    syncDirection: 'import' | 'export' | 'bidirectional'
    eventTypes: string[]
    autoCreateEvents: boolean
    conflictResolution: 'skip' | 'overwrite' | 'merge'
    reminderSettings: {
      enabled: boolean
      defaultMinutes: number
      methods: Array<'email' | 'popup'>
    }
  }
  createdAt: Date
  updatedAt: Date
}