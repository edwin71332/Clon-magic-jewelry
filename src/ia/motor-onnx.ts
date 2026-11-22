// motor-onnx.ts
// Responsabilidad única: Gestión del ciclo de vida del modelo ONNX e inferencia tensorial mediante WebAssembly

import * as ort from "onnxruntime-web";

// Configuración de la ruta de los binarios WebAssembly de ONNX Runtime
ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/";

export class MotorInferenciaONNX {
  private session: ort.InferenceSession | null = null;
  public estaListo: boolean = false;
  public modeloCargado: string = "";
  public dimensionEntrada: number = 84; // 84 para Exp A-D, 95 para Exp E

  /**
   * Carga el archivo .onnx en el navegador e inicializa la sesión de inferencia en WebAssembly.
   */
  public async inicializar(rutaModelo: string = "modelo_magic_jewelry_experimento_e.onnx"): Promise<boolean> {
    const modelosParaProbar = [
      rutaModelo,
      "modelo_magic_jewelry_experimento_e.onnx",
      "modelo_magic_jewelry_experimento_d.onnx",
      "modelo_magic_jewelry_3capas.onnx",
      "modelo_magic_jewelry.onnx"
    ];

    for (const ruta of modelosParaProbar) {
      try {
        this.session = await ort.InferenceSession.create(ruta, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });
        this.estaListo = true;
        this.modeloCargado = ruta;

        // Detección de la dimensión de entrada requerida por el modelo cargado
        if (ruta.includes("experimento_e")) {
          this.dimensionEntrada = 95;
        } else {
          this.dimensionEntrada = 84;
        }

        console.log(`[MotorInferenciaONNX] Modelo cargado: '${ruta}' (Dimensión de entrada: ${this.dimensionEntrada})`);
        return true;
      } catch (err) {
        // Continúa con la siguiente ruta candidata
      }
    }

    console.error("[MotorInferenciaONNX] No se pudo inicializar ningún modelo ONNX.");
    this.estaListo = false;
    return false;
  }

  /**
   * Construye el vector de entrada normalizado y ejecuta la pasada hacia adelante en la red neuronal.
   */
  public async inferirAccion(
    tableroNum: number[][],
    actualNum: number[],
    siguienteNum: number[]
  ): Promise<number> {
    if (!this.session || !this.estaListo) {
      throw new Error("[MotorInferenciaONNX] Sesión no inicializada.");
    }

    const datosEntrada = new Float32Array(this.dimensionEntrada);
    let idx = 0;

    // 1. Matriz de 78 celdas normalizadas
    for (let f = 0; f < 13; f++) {
      for (let c = 0; c < 6; c++) {
        datosEntrada[idx++] = tableroNum[f][c] / 7.0;
      }
    }

    // 2. Colores de la pieza actual
    for (let i = 0; i < 3; i++) {
      datosEntrada[idx++] = (actualNum[i] ?? 0) / 7.0;
    }

    // 3. Colores de la pieza en vista previa
    for (let i = 0; i < 3; i++) {
      datosEntrada[idx++] = (siguienteNum[i] ?? 0) / 7.0;
    }

    // 4. Variables topográficas explícitas si el modelo es de 95 entradas (Experimento E)
    if (this.dimensionEntrada === 95) {
      const alturas: number[] = [];
      for (let c = 0; c < 6; c++) {
        let alt = 0;
        for (let f = 0; f < 13; f++) {
          if (tableroNum[f][c] !== 0) {
            alt = 13 - f;
            break;
          }
        }
        alturas.push(alt);
        datosEntrada[idx++] = alt / 13.0;
      }

      // Desniveles (bumpiness) entre pares de columnas contiguas
      for (let c = 0; c < 5; c++) {
        datosEntrada[idx++] = Math.abs(alturas[c] - alturas[c + 1]) / 13.0;
      }
    }

    const tensorEntrada = new ort.Tensor("float32", datosEntrada, [1, this.dimensionEntrada]);
    const salidas = await this.session.run({ observacion: tensorEntrada });
    const tensorSalida = salidas["accion"];

    let accion = 0;
    if (tensorSalida.data instanceof BigInt64Array) {
      accion = Number(tensorSalida.data[0]);
    } else {
      accion = Number((tensorSalida.data as Int32Array | Float32Array)[0]);
    }

    return Math.max(0, Math.min(17, accion));
  }
}
