// Twilio WhatsApp webhook payload structure
export interface TwilioIncomingMessage {
    MessageSid: string;
    AccountSid: string;
    MessagingServiceSid?: string;
    From: string;  // Format: whatsapp:+1234567890
    To: string;    // Format: whatsapp:+1234567890
    Body: string;
    NumMedia: string;
    ProfileName?: string;
    WaId?: string;  // WhatsApp ID
    SmsMessageSid?: string;
    SmsSid?: string;
    SmsStatus?: string;
    ApiVersion?: string;
}
