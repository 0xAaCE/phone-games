interface WhatsAppIncomingMessageText {
    body: string;
}

interface WhatsAppIncomingMessageMessage {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text: WhatsAppIncomingMessageText;
}

interface WhatsAppIncomingMessageProfile {
    name: string;
}

interface WhatsAppIncomingMessageContact {
    profile: WhatsAppIncomingMessageProfile;
    wa_id: string;
}

interface WhatsAppIncomingMessageMetadata {
    display_phone_number: string;
    phone_number_id: string;
}

interface WhatsAppIncomingMessageValue {
    messaging_product: string;
    metadata: WhatsAppIncomingMessageMetadata;
    contacts: WhatsAppIncomingMessageContact[];
    messages: WhatsAppIncomingMessageMessage[];
}

interface WhatsAppIncomingMessageChange {
    value: WhatsAppIncomingMessageValue;
    field: string;
}

interface WhatsAppIncomingMessageEntry {
    id: string;
    changes: WhatsAppIncomingMessageChange[];
}

export interface WhatsAppIncomingMessage {
    object: "whatsapp_business_account";
    entry: WhatsAppIncomingMessageEntry[];
  }