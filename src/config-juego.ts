// Datos base reales del asset atlas
const ESCALA = 2;
const COLUMNAS = 6;
const FILAS = 13; // Filas
const columna_inicial = 3;
const fila_inicial = 0;
const TAMANIO_GEMA_ORIGINAL = 16;
const OFFSET_X_ASSET = 53;          // Dónde empieza el pozo en la textura
const OFFSET_SUELO_ASSET = 16; // Distancia del suelo al borde inferior
const ALTO_FONDO = 240;   // tamaño del fondo
const GEMA_SIG_VIEW_DIST = 21 // distancia del borde
const PUNTO_ADD_GEMA = 16

//coordenadas del puntaje, nivel y gemas destruidas
const UI_SCORE_X = 181 * ESCALA;
const UI_SCORE_Y = 26 * ESCALA;
const UI_JEWELRY_X = 189 * ESCALA;
const UI_JEWELRY_Y = 50 * ESCALA;
const UI_DIGITO_PASO_X = 8 * ESCALA;
const UI_LEVEL_X = 197 * ESCALA;
const UI_LEVEL_Y = 74 * ESCALA;

const PUNTOS_POR_GEMA = 30;

const DESTELLO_DELAY = 100;
const DESTELLO_PASOS = 9;
const DURACION_DESTELLO = DESTELLO_DELAY * DESTELLO_PASOS;

// Crea una matriz de F x C llena de ceros (0)
const GAMEAREA: number[][] = Array.from({ length: FILAS }, () => Array(COLUMNAS).fill(0));


const ANCHO_COLUMNA = TAMANIO_GEMA_ORIGINAL * ESCALA;
const LIMITE_IZQUIERDO = OFFSET_X_ASSET * ESCALA;
const LIMITE_DERECHO = LIMITE_IZQUIERDO + (COLUMNAS * ANCHO_COLUMNA);
const LIMITE_SUELO = (ALTO_FONDO - OFFSET_SUELO_ASSET) * ESCALA;
const GEMA_SIG_VIEW = GEMA_SIG_VIEW_DIST * ESCALA;
const MOVIMIENTO_GEMA_DOWN = TAMANIO_GEMA_ORIGINAL * ESCALA;
const ADD_GEMA_Y = (PUNTO_ADD_GEMA - 48) * ESCALA;
const ADD_GEMA_X = LIMITE_IZQUIERDO + (3 * ANCHO_COLUMNA);
const LIMITE_SUPERIOR = LIMITE_SUELO - (FILAS * ANCHO_COLUMNA);




export const CONFIG_JUEGO = {
    escala: ESCALA,
    velocidad: 5,
    MOVIMIENTO_DOWN: MOVIMIENTO_GEMA_DOWN,
    ADD_GEMA_Y,
    ADD_GEMA_X,
    GAMEAREA,
    COLUMNAS,
    FILAS,
    columna_inicial,
    fila_inicial,
    ANCHO_COLUMNA,
    limites: {
        izquierdo: LIMITE_IZQUIERDO,
        derecho: LIMITE_DERECHO,
        suelo: LIMITE_SUELO,
        superior: LIMITE_SUPERIOR,

    },
    tablero: {
        columnas: COLUMNAS,
        anchoColumna: ANCHO_COLUMNA,
        GEMA_SIG_VIEW,
    },
    ui: {
        score: {
            x: UI_SCORE_X,
            y: UI_SCORE_Y,
            digitos: 7,
        },
        jewelry: {
            x: UI_JEWELRY_X,
            y: UI_JEWELRY_Y,
            digitos: 5,
        },
        pasoX: UI_DIGITO_PASO_X,

        level: {
            x: UI_LEVEL_X,
            y: UI_LEVEL_Y,
            digitos: 3,
        },
    },
    puntuacion: {
        destello: {
            delay: DESTELLO_DELAY,
            repeat: DESTELLO_PASOS - 1
        },
        puntosPorGema: PUNTOS_POR_GEMA,
        duracionDestelloMs: DURACION_DESTELLO,
        puntosFlotantes: {
            columnaInicial: 3,
            filaInicial: 1,
            margenSalidaX: 20 * ESCALA,
            digitos: 5,
        },
    },
    nivel: {
        joyasPorNivel: 70,
        totalFondos: 8,
        totalPistasMusica: 10,
    },
    audio: {
        volumenMusica: 0.4,
        volumenSfx: 0.8,
    },
    dificultad: {
        delayBaseMs: 1000,
        reduccionPorNivelMs: 80,
        delayMinimoMs: 140,
    }

} as const;






