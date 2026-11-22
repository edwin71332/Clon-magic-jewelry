
import type { DecisionIA } from "./tipos";
import { SimuladorTablero } from "./simulador-tablero";

export class EvaluadorLookahead {
  private readonly simulador: SimuladorTablero;

  constructor(simulador: SimuladorTablero) {
    this.simulador = simulador;
  }

  /**
   * Simula las 18 combinaciones posibles (6 columnas x 3 rotaciones) y selecciona la óptima.
   */
  public evaluar(
    tableroNum: number[][],
    actualNum: number[],
    siguienteNum: number[],
    accionSugeridaRed: number
  ): DecisionIA {
    let mejorPuntaje = -Infinity;
    let mejorAccion = accionSugeridaRed;
    let fueLookahead = false;

    // Alturas previas de cada columna
    const alturasPrevias: number[] = [];
    for (let c = 0; c < SimuladorTablero.COLUMNAS; c++) {
      let alt = 0;
      for (let f = 0; f < SimuladorTablero.FILAS; f++) {
        if (tableroNum[f][c] !== 0) {
          alt = SimuladorTablero.FILAS - f;
          break;
        }
      }
      alturasPrevias.push(alt);
    }

    // Bucle de evaluación de las 18 combinaciones
    for (let col = 0; col < SimuladorTablero.COLUMNAS; col++) {
      for (let rot = 0; rot < 3; rot++) {
        const accionId = col * 3 + rot;
        const piezaRotada = this.simulador.rotarArray(actualNum, rot);

        // Clonación profunda de la matriz para simulación aislada
        const simTablero = tableroNum.map((fila) => [...fila]);
        const { desborde, filasOcupadas } = this.simulador.simularCaida(simTablero, col, piezaRotada);

        let puntaje = 0;

        if (desborde) {
          puntaje = -10000;
        } else {
          // 1. Evaluación de matches inmediatos tras la caída
          const matches = this.simulador.simularBuscarMatches(simTablero);
          const gemasDestruidas = matches.length;

          if (gemasDestruidas > 0) {
            puntaje += gemasDestruidas * 150;
          }

          // 2. Penalización continua por altura acumulada en la columna
          const nuevaAlturaCol = SimuladorTablero.FILAS - Math.min(...filasOcupadas);
          puntaje -= nuevaAlturaCol * 3;

          // Penalización cuadrática en zona crítica (> 8 gemas)
          if (nuevaAlturaCol > 8) {
            puntaje -= (nuevaAlturaCol - 8) * (nuevaAlturaCol - 8) * 15;
          }

          // 3. Penalización por rugosidad o desnivel (bumpiness) entre columnas adyacentes
          const vecinoIzq = col > 0 ? alturasPrevias[col - 1] : nuevaAlturaCol;
          const vecinoDer = col < 5 ? alturasPrevias[col + 1] : nuevaAlturaCol;
          const desnivelPromedio = (Math.abs(nuevaAlturaCol - vecinoIzq) + Math.abs(nuevaAlturaCol - vecinoDer)) / 2;
          puntaje -= desnivelPromedio * 4;

          // 4. Ponderación por adyacencia de colores en plano ortogonal y diagonal
          const adyacencias = this.contarAdyacenciasSimuladas(simTablero, filasOcupadas, col);
          puntaje += adyacencias * 8;

          // Bonificación por conservación de pares monocromáticos contiguos
          if (piezaRotada[0] === piezaRotada[1] || piezaRotada[1] === piezaRotada[2]) {
            puntaje += 6;
          }

          // 5. Penalización por oclusión de pares preexistentes alineados
          const penalizacionBloqueo = this.contarParesBloqueados(
            tableroNum,
            filasOcupadas,
            col,
            piezaRotada,
            siguienteNum
          );
          puntaje -= penalizacionBloqueo;

          // 6. Criterio de desempate guiado por la política de la red neuronal
          if (accionId === accionSugeridaRed) {
            puntaje += 2;
          }
        }

        if (puntaje > mejorPuntaje) {
          mejorPuntaje = puntaje;
          mejorAccion = accionId;
          if (accionId !== accionSugeridaRed) {
            fueLookahead = true;
          }
        }
      }
    }

    const colElegida = Math.floor(mejorAccion / 3);
    const rotElegida = mejorAccion % 3;

    // Telemetría de inferencia y decisión táctica
    const nombresColores = ["vacío", "rojo", "amarillo", "morado", "naranja", "azul", "verde", "cruz"];
    const piezaTexto = actualNum.map((v) => nombresColores[v] || v).join("-");
    const fuenteDecision = fueLookahead ? "Táctica Lookahead" : "Red Neuronal ONNX";

    console.log(
      `%c[Agente IA] %cPieza: [${piezaTexto}] ➔ Columna: ${colElegida} | Rotaciones: ${rotElegida} (%c${fuenteDecision}%c)`,
      "color: #00ffcc; font-weight: bold;",
      "color: #ffffff;",
      fueLookahead ? "color: #ffaa00; font-weight: bold;" : "color: #33ccff; font-weight: bold;",
      "color: #ffffff;"
    );

    return {
      columna: colElegida,
      rotacion: rotElegida,
      accionId: mejorAccion,
      esLookahead: fueLookahead,
    };
  }

  /**
   * Determina la columna óptima para el aterrizaje de la Gema Mágica en función de la abundancia de color.
   */
  public buscarMejorColumnaParaMagica(tableroNum: number[][]): number {
    const conteo = new Map<number, number>();
    for (let f = 0; f < SimuladorTablero.FILAS; f++) {
      for (let c = 0; c < SimuladorTablero.COLUMNAS; c++) {
        const val = tableroNum[f][c];
        if (val >= 1 && val <= 6) {
          conteo.set(val, (conteo.get(val) || 0) + 1);
        }
      }
    }

    let mejorColumna = 3;
    let maxGemasEliminadas = -1;

    for (let c = 0; c < SimuladorTablero.COLUMNAS; c++) {
      let primerFilaOcupada = SimuladorTablero.FILAS;
      for (let f = 0; f < SimuladorTablero.FILAS; f++) {
        if (tableroNum[f][c] !== 0) {
          primerFilaOcupada = f;
          break;
        }
      }

      if (primerFilaOcupada < 3) continue;

      const colorDestino = primerFilaOcupada < SimuladorTablero.FILAS ? tableroNum[primerFilaOcupada][c] : 0;
      const gemasQueElimina = conteo.get(colorDestino) || 0;

      if (gemasQueElimina > maxGemasEliminadas) {
        maxGemasEliminadas = gemasQueElimina;
        mejorColumna = c;
      }
    }

    return mejorColumna;
  }

  /**
   * Evalúa la viabilidad geométrica de adyacencias ortogonales y diagonales para prevenir callejones sin salida.
   */
  private contarAdyacenciasSimuladas(tablero: number[][], filas: number[], col: number): number {
    let ady = 0;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const f of filas) {
      const color = tablero[f][col];
      if (color === 0) continue;
      for (const [df, dc] of dirs) {
        const nf = f + df;
        const nc = col + dc;
        if (nf >= 0 && nf < SimuladorTablero.FILAS && nc >= 0 && nc < SimuladorTablero.COLUMNAS) {
          const esMismaPieza = nc === col && filas.includes(nf);
          if (!esMismaPieza && tablero[nf][nc] === color) {
            const ef1 = f - df, ec1 = col - dc;
            const ef2 = nf + df, ec2 = nc + dc;

            const viable1 = (ef1 >= 0 && ef1 < SimuladorTablero.FILAS && ec1 >= 0 && ec1 < SimuladorTablero.COLUMNAS) &&
              (tablero[ef1][ec1] === 0 || tablero[ef1][ec1] === color);
            const viable2 = (ef2 >= 0 && ef2 < SimuladorTablero.FILAS && ec2 >= 0 && ec2 < SimuladorTablero.COLUMNAS) &&
              (tablero[ef2][ec2] === 0 || tablero[ef2][ec2] === color);

            if (viable1 || viable2) {
              ady++; // Conexión viable con extremo abierto
            } else {
              // Conexión ocluida sin viabilidad geométrica de completitud
              ady -= 0.5; // Penalización por formación de línea inviable
            }
          }
        }
      }
    }
    return ady;
  }

  /**
   * Detecta si una jugada ocluye o bloquea el remate de un par ya formado en el tablero.
   */
  private contarParesBloqueados(
    tableroPrevio: number[][],
    filasOcupadas: number[],
    col: number,
    piezaRotada: number[],
    siguienteNum: number[]
  ): number {
    let penalizacionTotal = 0;
    const lineas = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal derecha
      [1, -1],  // Diagonal izquierda
    ];

    for (let i = 0; i < filasOcupadas.length; i++) {
      const f = filasOcupadas[i];
      const gemaColocada = piezaRotada[2 - i];

      for (const [df, dc] of lineas) {
        // Caso A: Par en dirección negativa
        const f1 = f - df, c1 = col - dc;
        const f2 = f - 2 * df, c2 = col - 2 * dc;
        if (f1 >= 0 && f1 < SimuladorTablero.FILAS && c1 >= 0 && c1 < SimuladorTablero.COLUMNAS &&
          f2 >= 0 && f2 < SimuladorTablero.FILAS && c2 >= 0 && c2 < SimuladorTablero.COLUMNAS) {
          const color1 = tableroPrevio[f1][c1];
          const color2 = tableroPrevio[f2][c2];
          if (color1 !== 0 && color1 !== 7 && color1 === color2 && gemaColocada !== color1) {
            penalizacionTotal += siguienteNum.includes(color1) ? 20 : 10;
          }
        }

        // Caso B: Par en dirección positiva
        const f3 = f + df, c3 = col + dc;
        const f4 = f + 2 * df, c4 = col + 2 * dc;
        if (f3 >= 0 && f3 < SimuladorTablero.FILAS && c3 >= 0 && c3 < SimuladorTablero.COLUMNAS &&
          f4 >= 0 && f4 < SimuladorTablero.FILAS && c4 >= 0 && c4 < SimuladorTablero.COLUMNAS) {
          const color3 = tableroPrevio[f3][c3];
          const color4 = tableroPrevio[f4][c4];
          if (color3 !== 0 && color3 !== 7 && color3 === color4 && gemaColocada !== color3) {
            penalizacionTotal += siguienteNum.includes(color3) ? 20 : 10;
          }
        }

        // Caso C: Hueco central entre dos gemas idénticas
        if (f1 >= 0 && f1 < SimuladorTablero.FILAS && c1 >= 0 && c1 < SimuladorTablero.COLUMNAS &&
          f3 >= 0 && f3 < SimuladorTablero.FILAS && c3 >= 0 && c3 < SimuladorTablero.COLUMNAS) {
          const colorIzq = tableroPrevio[f1][c1];
          const colorDer = tableroPrevio[f3][c3];
          if (colorIzq !== 0 && colorIzq !== 7 && colorIzq === colorDer && gemaColocada !== colorIzq) {
            penalizacionTotal += siguienteNum.includes(colorIzq) ? 20 : 10;
          }
        }
      }
    }

    return penalizacionTotal;
  }
}
