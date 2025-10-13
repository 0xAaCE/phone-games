import { MessagePlatform, IncomingMessage } from "./parsers";

export abstract class MessageHandler {
  abstract canHandle<t extends MessagePlatform>(messagePlatform: t, message: IncomingMessage<t>): boolean;
  abstract handle<t extends MessagePlatform>(messagePlatform: t, message: IncomingMessage<t>): Promise<void>;
}
