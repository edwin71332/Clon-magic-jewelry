// simulador-tablero.ts
// Responsabilidad única: Simulación física del tablero en memoria RAM (gravedad, caída, rotaciones y detección de combinaciones)

import type { CoordenadaGema, ResultadoCaida } from "./tipos";

export class SimuladorTablero {
  public static readonly FILAS: number = 13;
  public static readonly COLUMNAS: number = 6;

  /**
   * Aplica rotación cíclica a un trío de gemas.
   */
  public rotarArray(pieza: number[], rotacion: number): number[] {
    if (rotacion === 0) return [...pieza];
    if (rotacion === 1) return [pieza[2], pieza[0], pieza[1]];
    return [pieza[1], pieza[2], pieza[0]];
  }

  /**
   * Simula la caída física de una pieza en una columna sobre una matriz en memoria.
   */
  public simularCaida(tablero: number[][], col: number, pieza: number[]): ResultadoCaida {
    let primerBloque = SimuladorTablero.FILAS;
    for (let f = 0; f < SimuladorTablero.FILAS; f++) {
      if (tablero[f][col] !== 0) {
        primerBloque = f;
        break;
      }
    }

    const filaAsiento = primerBloque - 1;
    let desborde = false;
    const filasOcupadas: number[] = [];

    for (let i = 0; i < 3; i++) {
      const filaDestino = filaAsiento - i;
      const gema = pieza[2 - i];
      if (filaDestino >= 0) {
        tablero[filaDestino][col] = gema;
        filasOcupadas.push(filaDestino);
      } else {
        desborde = true;
      }
    }

    return { desborde, filasOcupadas };
  }

  /**
   * Escanea la matriz en busca de combinaciones de 3 o más gemas en 4 direcciones (horizontal, vertical y diagonales).
   */
  public simularBuscarMatches(tablero: number[][]): CoordenadaGema[] {
    const eliminados: CoordenadaGema[] = [];
    const marcar = (f: number, c: number) => {
      if (!eliminados.some((p) => p.f === f && p.c === c)) {
        eliminados.push({ f, c });
      }
    };

    for (let f = 0; f < SimuladorTablero.FILAS; f++) {
      for (let c = 0; c < SimuladorTablero.COLUMNAS; c++) {
        const color = tablero[f][c];
        if (color === 0 || color === 7) continue;

        // Detección horizontal
        if (c + 2 < SimuladorTablero.COLUMNAS && color === tablero[f][c + 1] && color === tablero[f][c + 2]) {
          marcar(f, c); marcar(f, c + 1); marcar(f, c + 2);
        }
        // Detección vertical
        if (f + 2 < SimuladorTablero.FILAS && color === tablero[f + 1][c] && color === tablero[f + 2][c]) {
          marcar(f, c); marcar(f + 1, c); marcar(f + 2, c);
        }
        // Detección diagonal derecha descendente
        if (f + 2 < SimuladorTablero.FILAS && c + 2 < SimuladorTablero.COLUMNAS && color === tablero[f + 1][c + 1] && color === tablero[f + 2][c + 2]) {
          marcar(f, c); marcar(f + 1, c + 1); marcar(f + 2, c + 2);
        }
        // Detección diagonal izquierda descendente
        if (f + 2 < SimuladorTablero.FILAS && c - 2 >= 0 && color === tablero[f + 1][c - 1] && color === tablero[f + 2][c - 2]) {
          marcar(f, c); marcar(f + 1, c - 1); marcar(f + 2, c - 2);
        }
      }
    }

    return eliminados;
  }
}
