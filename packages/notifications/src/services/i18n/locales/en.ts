/**
 * Translation structure type - allows any string values
 */
export type TranslationStructure = {
  party: {
    created: string;
    playerJoined: {
      body: string;
      listButton: string;
    };
    playerLeft: string;
    qrCodeAttached: string;
  };
  impostor: {
    matchStarted: {
      body: string;
      listButton: string;
    };
    nextRound: {
      body: string;
      listButton: string;
    };
    middleRoundAction: {
      body: string;
      listButton: string;
    };
    roundFinished: {
      body: string;
      listButton: string;
    };
    matchFinished: {
      body: string;
      listButton: string;
    };
    impostor: string;
    innocent: string;
  };
  commands: {
    createParty: string;
    startMatch: string;
    startRound: string;
    nextRound: string;
    finishRound: string;
    help: string;
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
    playerJoined: {
      body: 'A new player has joined the party "{{partyName}}"!',
      listButton: 'Actions',
    },
    playerLeft: 'A player has left the party "{{partyName}}".',
    qrCodeAttached: 'Scan the QR code to share this party invitation!',
  },

  // Game: Impostor
  impostor: {
    matchStarted: {
      body: 'The match has started! Get ready to play.',
      listButton: 'Actions',
    },
    nextRound: {
      body: 'The next round has started and your word is:\n\n{{word}}',
      listButton: 'Vote!',
    },
    middleRoundAction: {
      body: 'Your vote has been recorded.',
      listButton: 'Actions',
    },
    roundFinished: {
      body: 'Round {{round}} has finished!',
      listButton: 'Actions',
    },
    matchFinished: {
      body: 'The match has finished! Thanks for playing.',
      listButton: 'Actions',
    },
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

  commands: {
    createParty: '/create_party - Create Party',
    startMatch: '/start_match - Start Match',
    startRound: '/start_round - Start Round',
    nextRound: '/next_round - Next Round',
    finishRound: '/finish_round - Finish Round',
    help: '/help - Help',
  },
};
