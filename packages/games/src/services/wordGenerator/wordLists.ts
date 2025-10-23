/**
 * Word categories for the Impostor game
 */
export enum WordCategory {
  ANIMALS = 'animals',
  FOOD = 'food',
  PLACES = 'places',
  OBJECTS = 'objects',
  NATURE = 'nature',
  ENTERTAINMENT = 'entertainment',
  PROFESSIONS = 'professions',
  SPORTS = 'sports',
}

/**
 * Supported languages for word lists
 */
export type WordLanguage = 'en' | 'es';

/**
 * Word list structure by language and category
 */
export type WordLists = {
  [lang in WordLanguage]: {
    [category in WordCategory]: string[];
  };
};

/**
 * Comprehensive word lists for Impostor game
 * Organized by language and category for better gameplay variety
 */
export const WORD_LISTS: WordLists = {
  en: {
    [WordCategory.ANIMALS]: [
      'elephant', 'penguin', 'giraffe', 'dolphin', 'kangaroo',
      'butterfly', 'octopus', 'flamingo', 'koala', 'panda',
      'tiger', 'eagle', 'shark', 'lion', 'bear',
      'wolf', 'rabbit', 'turtle', 'owl', 'fox',
    ],
    [WordCategory.FOOD]: [
      'pizza', 'sushi', 'burger', 'pasta', 'taco',
      'ice cream', 'chocolate', 'cupcake', 'sandwich', 'salad',
      'pancake', 'coffee', 'smoothie', 'cookie', 'donut',
      'cheese', 'bread', 'apple', 'banana', 'orange',
    ],
    [WordCategory.PLACES]: [
      'beach', 'mountain', 'forest', 'desert', 'ocean',
      'library', 'museum', 'park', 'castle', 'temple',
      'stadium', 'theater', 'mall', 'airport', 'harbor',
      'volcano', 'island', 'canyon', 'lighthouse', 'bridge',
    ],
    [WordCategory.OBJECTS]: [
      'guitar', 'piano', 'camera', 'telescope', 'compass',
      'bicycle', 'skateboard', 'umbrella', 'backpack', 'lamp',
      'clock', 'mirror', 'pillow', 'blanket', 'candle',
      'book', 'pen', 'key', 'phone', 'laptop',
    ],
    [WordCategory.NATURE]: [
      'rainbow', 'sunset', 'thunder', 'lightning', 'tornado',
      'waterfall', 'river', 'lake', 'flower', 'tree',
      'cloud', 'star', 'moon', 'sun', 'wind',
      'rain', 'snow', 'fog', 'storm', 'galaxy',
    ],
    [WordCategory.ENTERTAINMENT]: [
      'movie', 'concert', 'festival', 'carnival', 'circus',
      'magic show', 'parade', 'dance', 'theater', 'comedy',
      'musical', 'opera', 'ballet', 'circus', 'carnival',
      'party', 'celebration', 'fireworks', 'karaoke', 'game',
    ],
    [WordCategory.PROFESSIONS]: [
      'doctor', 'teacher', 'chef', 'pilot', 'artist',
      'musician', 'engineer', 'scientist', 'architect', 'designer',
      'photographer', 'writer', 'firefighter', 'police', 'nurse',
      'lawyer', 'judge', 'athlete', 'astronaut', 'sailor',
    ],
    [WordCategory.SPORTS]: [
      'soccer', 'basketball', 'tennis', 'baseball', 'volleyball',
      'swimming', 'running', 'cycling', 'skiing', 'surfing',
      'boxing', 'karate', 'yoga', 'dance', 'golf',
      'hockey', 'rugby', 'cricket', 'badminton', 'bowling',
    ],
  },
  es: {
    [WordCategory.ANIMALS]: [
      'elefante', 'pingüino', 'jirafa', 'delfín', 'canguro',
      'mariposa', 'pulpo', 'flamenco', 'koala', 'panda',
      'tigre', 'águila', 'tiburón', 'león', 'oso',
      'lobo', 'conejo', 'tortuga', 'búho', 'zorro',
    ],
    [WordCategory.FOOD]: [
      'pizza', 'sushi', 'hamburguesa', 'pasta', 'taco',
      'helado', 'chocolate', 'cupcake', 'sándwich', 'ensalada',
      'panqueque', 'café', 'licuado', 'galleta', 'dona',
      'queso', 'pan', 'manzana', 'plátano', 'naranja',
    ],
    [WordCategory.PLACES]: [
      'playa', 'montaña', 'bosque', 'desierto', 'océano',
      'biblioteca', 'museo', 'parque', 'castillo', 'templo',
      'estadio', 'teatro', 'centro comercial', 'aeropuerto', 'puerto',
      'volcán', 'isla', 'cañón', 'faro', 'puente',
    ],
    [WordCategory.OBJECTS]: [
      'guitarra', 'piano', 'cámara', 'telescopio', 'brújula',
      'bicicleta', 'patineta', 'paraguas', 'mochila', 'lámpara',
      'reloj', 'espejo', 'almohada', 'manta', 'vela',
      'libro', 'pluma', 'llave', 'teléfono', 'laptop',
    ],
    [WordCategory.NATURE]: [
      'arcoíris', 'atardecer', 'trueno', 'relámpago', 'tornado',
      'cascada', 'río', 'lago', 'flor', 'árbol',
      'nube', 'estrella', 'luna', 'sol', 'viento',
      'lluvia', 'nieve', 'niebla', 'tormenta', 'galaxia',
    ],
    [WordCategory.ENTERTAINMENT]: [
      'película', 'concierto', 'festival', 'carnaval', 'circo',
      'show de magia', 'desfile', 'baile', 'teatro', 'comedia',
      'musical', 'ópera', 'ballet', 'circo', 'carnaval',
      'fiesta', 'celebración', 'fuegos artificiales', 'karaoke', 'juego',
    ],
    [WordCategory.PROFESSIONS]: [
      'doctor', 'maestro', 'chef', 'piloto', 'artista',
      'músico', 'ingeniero', 'científico', 'arquitecto', 'diseñador',
      'fotógrafo', 'escritor', 'bombero', 'policía', 'enfermera',
      'abogado', 'juez', 'atleta', 'astronauta', 'marinero',
    ],
    [WordCategory.SPORTS]: [
      'fútbol', 'baloncesto', 'tenis', 'béisbol', 'voleibol',
      'natación', 'carrera', 'ciclismo', 'esquí', 'surf',
      'boxeo', 'karate', 'yoga', 'baile', 'golf',
      'hockey', 'rugby', 'cricket', 'bádminton', 'boliche',
    ],
  },
};
