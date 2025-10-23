import type { TranslationStructure } from './en.js';

/**
 * Spanish translations for notifications
 */
export const es: TranslationStructure = {
  // Party actions
  party: {
    created: 'Partida "{{partyName}}" creada exitosamente! ID de partida: {{partyId}}',
    playerJoined: '¡Un nuevo jugador se ha unido a la partida "{{partyName}}"!',
    playerLeft: 'Un jugador ha salido de la partida "{{partyName}}".',
  },

  // Game: Impostor
  impostor: {
    matchStarted: '¡La partida ha comenzado! Prepárate para jugar.',
    nextRound: 'La siguiente ronda ha comenzado y tu palabra es:\n\n{{word}}',
    voteReceived: 'Tu voto ha sido registrado.',
    roundFinished: '¡La ronda {{round}} ha terminado!',
    matchFinished: '¡La partida ha terminado! Gracias por jugar.',
    impostor: 'IMPOSTOR',
    innocent: 'INOCENTE',
  },

  // Common
  common: {
    round: 'Ronda',
    of: 'de',
    players: 'jugadores',
    player: 'jugador',
  },
} as const;
