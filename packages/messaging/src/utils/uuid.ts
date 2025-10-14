import { v5 as uuidv5 } from 'uuid';

// WhatsApp namespace UUID for deterministic user ID generation
// Note: 'wp' is not valid hex, using 'aaaa' prefix instead for WhatsApp namespace
const WHATSAPP_NAMESPACE = 'aaaaaaaa-9dad-11d1-80b4-00c04fd430c8';

/**
 * Convert WhatsApp ID (wa_id) to a deterministic UUID
 * This ensures the same wa_id always generates the same UUID
 */
export function waIdToUserId(waId: string): string {
  return uuidv5(waId, WHATSAPP_NAMESPACE);
}
