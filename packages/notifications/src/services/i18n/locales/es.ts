import type { TranslationStructure } from './en.js';

/**
 * Spanish translations for notifications
 */
export const es: TranslationStructure = {
  // Party actions
  party: {
    created: 'Partida "{{partyName}}" creada exitosamente! ID de partida: {{partyId}}',
    playerJoined: {
      body: '¡Un nuevo jugador se ha unido a la partida "{{partyName}}"!',
      listButton: 'Ver lista de jugadores',
    },
    playerLeft: 'Un jugador ha salido de la partida "{{partyName}}".',
    qrCodeAttached: '¡Escanea el código QR para compartir esta invitación!',
  },

  // Game: Impostor
  impostor: {
    matchStarted: {
      body: '¡La partida ha comenzado! Prepárate para jugar.',
      listButton: 'Acciones',
    },
    nextRound: {
      body: 'La siguiente ronda ha comenzado y tu palabra es:\n\n{{word}}',
      listButton: '¡Votar!',
    },
    middleRoundAction: {
      body: 'Tu voto ha sido registrado.',
      listButton: 'Acciones',
    },
    roundFinished: {
      body: '¡La ronda {{round}} ha terminado!',
      listButton: 'Acciones',
    },
    matchFinished: {
      body: '¡La partida ha terminado! Gracias por jugar.',
      listButton: 'Acciones',
    },
    impostor: 'IMPOSTOR',
    innocent: 'INOCENTE',
  },

  commands: {
    createParty: '/create_party - Crear partida',
    startMatch: '/start_match - Comenzar partida',
    startRound: '/start_round - Comenzar ronda',
    nextRound: '/next_round - Siguiente ronda',
    finishRound: '/finish_round - Finalizar ronda',
    help: '/help - Ayuda!',
  },

  // Common
  common: {
    round: 'Ronda',
    of: 'de',
    players: 'jugadores',
    player: 'jugador',
  },
} as const;
