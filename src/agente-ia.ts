// agente-ia.ts
// Fachada (Facade) orquestadora del subsistema de Inteligencia Artificial para el motor Phaser 3

import type { DecisionIA } from "./ia/tipos";
import { MotorInferenciaONNX } from "./ia/motor-onnx";
import { SimuladorTablero } from "./ia/simulador-tablero";
import { EvaluadorLookahead } from "./ia/evaluador-lookahead";

export type { DecisionIA };

export class AgenteIA {
  private readonly motorONNX: MotorInferenciaONNX;
  private readonly simulador: SimuladorTablero;
  private readonly evaluador: EvaluadorLookahead;

  private readonly mapaColores: Map<string, number> = new Map([
    ["gema_roja", 1],
    ["gema_amarilla", 2],
    ["gema_morada", 3],
    ["gema_naranja", 4],
    ["gema_azul", 5],
    ["gema_verde", 6],
    ["gema_cruz", 7],
  ]);

  constructor() {
    this.motorONNX = new MotorInferenciaONNX();
    this.simulador = new SimuladorTablero();
    this.evaluador = new EvaluadorLookahead(this.simulador);
  }

  public get estaListo(): boolean {
    return this.motorONNX.estaListo;
  }

  public get modeloCargado(): string {
    return this.motorONNX.modeloCargado;
  }

  public get dimensionEntrada(): number {
    return this.motorONNX.dimensionEntrada;
  }

  /**
   * Inicializa el motor de inferencia ONNX en WebAssembly.
   */
  public async inicializar(rutaModelo: string = "modelo_magic_jewelry_experimento_e.onnx"): Promise<boolean> {
    return this.motorONNX.inicializar(rutaModelo);
  }

  /**
   * Orquesta la conversión de sprites visuales de Phaser y coordina la inferencia y búsqueda táctica.
   */
  public async predecirJugada(
    matrizTablero: (Phaser.GameObjects.Sprite | null)[][],
    piezaActual: Phaser.GameObjects.Sprite[],
    piezaSiguiente: Phaser.GameObjects.Sprite[]
  ): Promise<DecisionIA> {
    // 1. Mapeo de sprites visuales a representación numérica normalizada
    const tableroNum: number[][] = Array.from({ length: SimuladorTablero.FILAS }, () => Array(SimuladorTablero.COLUMNAS).fill(0));
    for (let f = 0; f < SimuladorTablero.FILAS; f++) {
      for (let c = 0; c < SimuladorTablero.COLUMNAS; c++) {
        tableroNum[f][c] = this.obtenerValorGema(matrizTablero[f][c]);
      }
    }

    const actualNum = piezaActual.map((s) => this.obtenerValorGema(s));
    const siguienteNum = piezaSiguiente.map((s) => this.obtenerValorGema(s));
    const esMagica = actualNum.length > 0 && actualNum[0] === 7;

    // 2. Desvío determinista para la Gema Mágica
    if (esMagica) {
      const mejorColumnaMagica = this.evaluador.buscarMejorColumnaParaMagica(tableroNum);
      return {
        columna: mejorColumnaMagica,
        rotacion: 0,
        accionId: mejorColumnaMagica * 3,
        esLookahead: true,
      };
    }

    // 3. Inferencia de política global mediante red neuronal ONNX
    let accionRed = 9; // Acción central por defecto (columna 3, rotación 0)
    if (this.motorONNX.estaListo) {
      try {
        accionRed = await this.motorONNX.inferirAccion(tableroNum, actualNum, siguienteNum);
      } catch (e) {
        console.warn("[AgenteIA] Fallback táctico activado por excepción en red:", e);
      }
    }

    // 4. Búsqueda táctica Lookahead asistida con la pieza en vista previa
    return this.evaluador.evaluar(tableroNum, actualNum, siguienteNum, accionRed);
  }

  private obtenerValorGema(sprite: Phaser.GameObjects.Sprite | null): number {
    if (!sprite || !sprite.frame) return 0;
    return this.mapaColores.get(sprite.frame.name) || 0;
  }
}
