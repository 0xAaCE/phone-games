/**
 * Translation structure type - allows any string values
 */
export type TranslationStructure = {
  party: {
    created: string;
    playerJoined: string;
    playerLeft: string;
    qrCodeAttached: string;
  };
  impostor: {
    matchStarted: string;
    nextRound: string;
    voteReceived: string;
    roundFinished: string;
    matchFinished: string;
    impostor: string;
    innocent: string;
  };
  common: {
    round: string;
    of: string;
    players: string;
    player: string;
  };
};

/**
 * English translations for notifications
 */
export const en: TranslationStructure = {
  // Party actions
  party: {
    created: 'Party "{{partyName}}" created successfully! Party ID: {{partyId}}',
    playerJoined: 'A new player has joined the party "{{partyName}}"!',
    playerLeft: 'A player has left the party "{{partyName}}".',
    qrCodeAttached: 'Scan the QR code to share this party invitation!',
  },

  // Game: Impostor
  impostor: {
    matchStarted: 'The match has started! Get ready to play.',
    nextRound: 'The next round has started and your word is:\n\n{{word}}',
    voteReceived: 'Your vote has been recorded.',
    roundFinished: 'Round {{round}} has finished!',
    matchFinished: 'The match has finished! Thanks for playing.',
    impostor: 'IMPOSTOR',
    innocent: 'INNOCENT',
  },

  // Common
  common: {
    round: 'Round',
    of: 'of',
    players: 'players',
    player: 'player',
  },
};
