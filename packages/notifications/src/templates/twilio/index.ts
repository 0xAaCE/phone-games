import { CardAction, ContentCreateRequest, ListItem, TwilioCard } from 'twilio/lib/rest/content/v1/content.js';

/**
 * List picker item configuration
 */
export interface ListPickerItem {
  id: string;
  item: string;
  description?: string;
}

/**
 * Quick reply button configuration
 */
export interface QuickReplyButton {
  id: string;
  title: string;
}

/**
 * Builder for Twilio List Picker templates
 */
export class TwilioListPickerBuilder {
  private _name: string;
  private _language: string = 'en';
  private _body: string = '';
  private _button: string = 'Select';
  private _items: ListPickerItem[] = [];

  private constructor(name: string) {
    this._name = name;
  }

  static create(name: string): TwilioListPickerBuilder {
    return new TwilioListPickerBuilder(name);
  }

  language(lang: string): this {
    this._language = lang;
    return this;
  }

  body(body: string): this {
    this._body = body;
    return this;
  }

  button(text: string): this {
    this._button = text;
    return this;
  }

  addItem(item: ListPickerItem): this {
    this._items.push(item);
    return this;
  }

  addItems(items: ListPickerItem[]): this {
    this._items.push(...items);
    return this;
  }

  build(): ContentCreateRequest {
    if (this._items.length === 0) {
      throw new Error('List picker requires at least one item');
    }

    return {
      friendlyName: this._name,
      language: this._language,
      types: {
        'twilioListPicker': {
          body: this._body,
          button: this._button,
          items: this._items.map(item => {
            const listItem: ListItem = {
              id: item.id,
              item: item.item,
            };


            if (item.description) {
              listItem.description = item.description;
            }

            return listItem;
          }),
        },
      },
    };
  }
}

/**
 * Builder for Twilio Quick Reply templates
 */
export class TwilioQuickReplyBuilder {
  private _name: string;
  private _language: string = 'en';
  private _body: string = '';
  private _buttons: QuickReplyButton[] = [];

  private constructor(name: string) {
    this._name = name;
  }

  static create(name: string): TwilioQuickReplyBuilder {
    return new TwilioQuickReplyBuilder(name);
  }

  language(lang: string): this {
    this._language = lang;
    return this;
  }

  body(body: string): this {
    this._body = body;
    return this;
  }

  addButton(button: QuickReplyButton): this {
    if (this._buttons.length >= 3) {
      throw new Error('Quick reply supports maximum 3 buttons');
    }
    this._buttons.push(button);
    return this;
  }

  build(): ContentCreateRequest {
    if (this._buttons.length === 0) {
      throw new Error('Quick reply requires at least one button');
    }

    return {
      friendlyName: this._name,
      language: this._language,
      types: {
        'twilioQuickReply': {
          body: this._body,
          actions: this._buttons.map(btn => ({
            id: btn.id,
            title: btn.title,
            type: 'QUICK_REPLY' as const,
          })),
        },
      },
    };
  }
}

/**
 * Builder for Twilio Text templates
 */
export class TwilioTextBuilder {
  private _name: string;
  private _language: string = 'en';
  private _body: string = '';

  private constructor(name: string) {
    this._name = name;
  }

  static create(name: string): TwilioTextBuilder {
    return new TwilioTextBuilder(name);
  }

  language(lang: string): this {
    this._language = lang;
    return this;
  }

  body(body: string): this {
    this._body = body;
    return this;
  }

  build(): ContentCreateRequest {
    return {
      friendlyName: this._name,
      language: this._language,
      types: {
        'twilioText': {
          body: this._body,
        },
      },
    };
  }
}

/**
 * Builder for Twilio Card templates
 */
export class TwilioCardBuilder {
  private _name: string;
  private _language: string = 'en';
  private _title: string = '';
  private _subtitle: string = '';
  private _mediaUrl?: string;
  private _actions: Array<{ type: string; title: string; url?: string; phone?: string }> = [];

  private constructor(name: string) {
    this._name = name;
  }

  static create(name: string): TwilioCardBuilder {
    return new TwilioCardBuilder(name);
  }

  language(lang: string): this {
    this._language = lang;
    return this;
  }

  title(title: string): this {
    this._title = title;
    return this;
  }

  subtitle(subtitle: string): this {
    this._subtitle = subtitle;
    return this;
  }

  media(url: string): this {
    this._mediaUrl = url;
    return this;
  }

  addUrlButton(title: string, url: string): this {
    this._actions.push({ type: 'URL', title, url });
    return this;
  }

  addPhoneButton(title: string, phone: string): this {
    this._actions.push({ type: 'PHONE_NUMBER', title, phone });
    return this;
  }

  build(): ContentCreateRequest {
    const cardContent: TwilioCard = {
      title: this._title,
      subtitle: this._subtitle,
    };

    if (this._mediaUrl) {
      cardContent.media = [this._mediaUrl];
    }

    if (this._actions.length > 0) {
      cardContent.actions = this._actions.map((action) => {
        return {
          type: action.type,
          title: action.title,
          url: action.url,
          phone: action.phone,
        } as CardAction;
      });
    }

    return {
      friendlyName: this._name,
      language: this._language,
      types: {
        'twilioCard': cardContent,
      },
    };
  }
}

/**
 * Factory for creating Twilio template builders
 *
 * @example
 * ```typescript
 * // Create a list picker for voting
 * const template = TwilioTemplateFactory
 *   .buildListPicker('vote-template')
 *   .language('es')
 *   .body('Tu palabra es: {{word}}. ¿Quién es el impostor?')
 *   .button('Votar')
 *   .addItem({ id: '{{id_1}}', name: '{{name_1}}' })
 *   .addItem({ id: '{{id_2}}', name: '{{name_2}}' })
 *   .build();
 *
 * // Create quick reply buttons
 * const quickReply = TwilioTemplateFactory
 *   .buildQuickReply('confirm-action')
 *   .language('en')
 *   .body('Ready to start?')
 *   .addButton({ id: 'yes', title: 'Yes' })
 *   .addButton({ id: 'no', title: 'No' })
 *   .build();
 * ```
 */
export class TwilioTemplateFactory {
  static buildListPicker(name: string): TwilioListPickerBuilder {
    return TwilioListPickerBuilder.create(name);
  }

  static buildQuickReply(name: string): TwilioQuickReplyBuilder {
    return TwilioQuickReplyBuilder.create(name);
  }

  static buildText(name: string): TwilioTextBuilder {
    return TwilioTextBuilder.create(name);
  }

  static buildCard(name: string): TwilioCardBuilder {
    return TwilioCardBuilder.create(name);
  }
}
