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
    createParty: 'Crear partida',
    startMatch:  'Comenzar partida',
    startRound:  'Comenzar ronda',
    nextRound:   'Siguiente ronda',
    finishRound: 'Finalizar ronda',
    help:        'Ayuda',
  },

  // Common
  common: {
    round: 'Ronda',
    of: 'de',
    players: 'jugadores',
    player: 'jugador',
  },

  help: {
    body: '*Phone Games* 🎮\nJuegos sociales multijugador, jugados por WhatsApp. Sin necesidad de app.\n\n*Juegos*\n• Impostor – Un jugador es secretamente el impostor. Encuéntralo antes de que sea tarde.\n\n*Comandos*\n• /create_party impostor [nombre] – Crear una nueva partida\n• /join [id-partida] – Unirse a una partida existente\n• /leave – Salir de la partida actual\n• /start – Iniciar la partida\n• /vote [jugador] – Votar para eliminar a un jugador\n• /next – Iniciar la siguiente ronda\n• /help – Mostrar este mensaje',
  },
} as const;
