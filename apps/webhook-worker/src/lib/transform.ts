import type { ClerkWebhookEvent, TransformedEvent } from '../types'

export function transformClerkEvent(event: ClerkWebhookEvent): TransformedEvent {
  const emailObj = event.data.email_addresses[0]
  
  return {
    event: event.type,
    data: {
      clerkId: event.data.id,
      email: emailObj?.email_address || '',
      firstName: event.data.first_name || '',
      lastName: event.data.last_name || '',
      createdAt: new Date(event.data.created_at).toISOString(),
      updatedAt: new Date(event.data.updated_at).toISOString()
    },
    timestamp: Date.now()
  }
} 