import { ContentCreateRequest } from 'twilio/lib/rest/content/v1/content.js';

export type TwilioTemplate =
  | (ContentCreateRequest & { sid?: never, contentVariables?: never}) // allow optional sid on requests
  | { sid: string, contentVariables?: string }; // allow pure sid reference