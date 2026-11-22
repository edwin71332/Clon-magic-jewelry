// tipos.ts
// Definiciones de tipos e interfaces para el subsistema de Inteligencia Artificial

export interface DecisionIA {
  columna: number;        // Columna destino en el tablero (0 a 5)
  rotacion: number;       // Número de rotaciones cíclicas a aplicar (0, 1 o 2)
  accionId: number;       // Identificador compuesto de acción (columna * 3 + rotación)
  esLookahead?: boolean;  // Indica si la decisión final fue optimizada por búsqueda táctica
}

export interface ResultadoCaida {
  desborde: boolean;
  filasOcupadas: number[];
}

export interface CoordenadaGema {
  f: number;
  c: number;
}
