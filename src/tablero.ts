import Phaser from "phaser";
import { CONFIG_JUEGO } from "./config-juego";
import { gemasname } from "./gemas";
import { Marcador } from "./marcador";
import { sonidos } from "./sonidos";
import { piezas } from "./PIEZAS";

export class tablero {

    private scene: Phaser.Scene;
    private marcador: Marcador;
    private sonido: sonidos;


    filas = CONFIG_JUEGO.FILAS;
    columnas = CONFIG_JUEGO.COLUMNAS;


    constructor(scene: Phaser.Scene, marcador: Marcador, sonido: sonidos) {
        this.scene = scene;
        this.marcador = marcador;
        this.sonido = sonido;
    }

    tablero: (Phaser.GameObjects.Sprite | null)[][] = Array.from({ length: this.filas }, () => Array(this.columnas).fill(null));


    //   Método orquestador 
    public procesar_tablero(onTerminado?: () => void, chainStep: number = 1) {
        const gemas = this.buscar_matches();
        if (gemas && gemas.size > 0) {
            const puntos = gemas.size * CONFIG_JUEGO.puntuacion.puntosPorGema * chainStep;
            this.marcador.mostrarPuntosFlotantes(puntos);
            this.animar_destello(gemas, chainStep, () => {
                this.eliminar_bloque(gemas, chainStep);
                this.gravedad();
                this.procesar_tablero(onTerminado, chainStep + 1); // Incrementa el eslabón de combo
            });
        } else {
            if (onTerminado) onTerminado();
        }
    }

    // recorre la mariz en busca de Matches y asi verificar si se elimian gemas
    public buscar_matches(): Set<Phaser.GameObjects.Sprite> | undefined {

        const gemasAEliminar = new Set<Phaser.GameObjects.Sprite>();

        for (let F = 0; F < this.filas; F++) {
            for (let C = 0; C < this.columnas; C++) {

                //bloque horizontal
                if (C + 2 < this.columnas) {
                    const C1 = this.tablero[F][C];
                    const C2 = this.tablero[F][C + 1];
                    const C3 = this.tablero[F][C + 2];

                    if (C1 !== null && C2 !== null && C3 !== null) {
                        if (C1.frame.name === C2.frame.name && C1.frame.name === C3.frame.name
                        ) {
                            gemasAEliminar.add(C1);
                            gemasAEliminar.add(C2);
                            gemasAEliminar.add(C3);
                        }
                    }
                }//cierre bloque horizontal!

                //bloque vertical
                if (F + 2 < this.filas) {
                    const F1 = this.tablero[F][C];
                    const F2 = this.tablero[F + 1][C];
                    const F3 = this.tablero[F + 2][C];

                    if (F1 !== null && F2 !== null && F3 !== null) {
                        if (F1.frame.name === F2.frame.name && F1.frame.name === F3.frame.name
                        ) {
                            gemasAEliminar.add(F1);
                            gemasAEliminar.add(F2);
                            gemasAEliminar.add(F3);
                        }
                    }
                }//cierre bloque vertical

                //bloque diagonal hacia la derecha
                if (F + 2 < this.filas && C + 2 < this.columnas) {
                    const D1 = this.tablero[F][C];
                    const D2 = this.tablero[F + 1][C + 1];
                    const D3 = this.tablero[F + 2][C + 2];

                    if (D1 !== null && D2 !== null && D3 !== null) {
                        if (D1.frame.name === D2.frame.name && D1.frame.name === D3.frame.name
                        ) {
                            gemasAEliminar.add(D1);
                            gemasAEliminar.add(D2);
                            gemasAEliminar.add(D3);
                        }
                    }
                }//cierre bloque diagonal derecha

                //bloque diagonal hacia la izq
                if (F + 2 < this.filas && C - 2 >= 0) {
                    const D1 = this.tablero[F][C];
                    const D2 = this.tablero[F + 1][C - 1];
                    const D3 = this.tablero[F + 2][C - 2];

                    if (D1 !== null && D2 !== null && D3 !== null) {
                        if (D1.frame.name === D2.frame.name && D1.frame.name === D3.frame.name
                        ) {
                            gemasAEliminar.add(D1);
                            gemasAEliminar.add(D2);
                            gemasAEliminar.add(D3);
                        }
                    }
                }//cierre bloque diagonal izq

            }
        }
        return gemasAEliminar;

    }

    // Elimina las gemas si hay coincidencias y registra los puntos con multiplicador de combo
    public eliminar_bloque(gemas: Set<Phaser.GameObjects.Sprite>, multiplicadorCombo: number = 1) {
        this.marcador.sumar(gemas.size, multiplicadorCombo);

        for (let F = 0; F < this.filas; F++) {
            for (let C = 0; C < this.columnas; C++) {
                const sprite = this.tablero[F][C];
                if (sprite !== null && gemas.has(sprite)) {
                    sprite.destroy()
                    this.tablero[F][C] = null
                }
            }
        }
    }

    //aplica graverdad a los bloques de gemas destruidos
    public gravedad() {

        for (let C = 0; C < this.columnas; C++) {
            let filadestino = this.filas - 1 //el sueelo dl todo

            for (let F = this.filas - 1; F >= 0; F--) {
                if (this.tablero[F][C] !== null) {
                    if (F !== filadestino) {

                        // moveer matriz
                        this.tablero[filadestino][C] = this.tablero[F][C];
                        this.tablero[F][C] = null;

                        //mover sprite
                        this.tablero[filadestino][C]!.y += (filadestino - F) * CONFIG_JUEGO.MOVIMIENTO_DOWN;
                    }
                    filadestino--;
                }
            }
        }
    }



    //guarda un bloque (pieza) en la matriz (tablero)
    public fijar_pieza(pieza: piezas) {
        for (let i = 0; i < 3; i++) {
            const fila = pieza.fila_actual + i;
            if (fila >= 0 && fila < this.filas) {
                this.tablero[fila][pieza.columna_actual] = pieza.gemasSprites[i];
            }
        }
    }

    public Hay_suelo(pieza: piezas): boolean {

        if (pieza.fila_actual >= CONFIG_JUEGO.FILAS - 3) return true;
        if (pieza.fila_actual + 3 < 0) return false;
        if (this.tablero[pieza.fila_actual + 3][pieza.columna_actual] === null) return false;
        return true;
    }


    public hay_vecinos(dir: number, pieza: piezas): boolean {

        let coldestino = pieza.columna_actual + dir;
        if (coldestino < 0 || coldestino >= this.columnas) return true;

        for (let i = 0; i < 3; i++) {
            let fila = pieza.fila_actual + i;
            if (fila >= 0 && this.tablero[fila][coldestino] !== null) {
                return true
            }


        }
        return false
    }


    // Realizar el parpade antes de eliminar las gemas
    // Realizar el destello original antes de eliminar las gemas
    public animar_destello(gemas: Set<Phaser.GameObjects.Sprite>, chainStep: number, onComplete: () => void) {
        const colores = Phaser.Utils.Array.Shuffle([...gemasname]).slice(0, 3);

        let paso = 0;

        this.scene.time.addEvent({
            delay: CONFIG_JUEGO.puntuacion.destello.delay,
            repeat: CONFIG_JUEGO.puntuacion.destello.repeat,
            callback: () => {
                if (paso === 0) {
                    gemas.forEach(s => s.visible = false);
                } else if (paso === 1) {
                    gemas.forEach(s => s.visible = true);
                } else if (paso === 2) {
                    gemas.forEach(s => s.visible = false);
                } else if (paso === 3) {
                    gemas.forEach(s => s.visible = true);
                } else if (paso === 4) {
                    gemas.forEach(s => s.visible = true);
                } else if (paso === 5) {
                    gemas.forEach(s => s.setFrame(colores[0]));
                } else if (paso === 6) {
                    gemas.forEach(s => s.setFrame(colores[1]));
                } else if (paso === 7) {
                    gemas.forEach(s => s.setFrame(colores[2]));
                } else if (paso === 8) {
                    onComplete(); // Al terminar los 9 pasos, destruye y aplica gravedad
                    return;
                }

                // Dispara el sonido en cada uno de los pasos (0 al 7) con el tono progresivo
                this.sonido.playClear(chainStep, paso);

                paso++;
            }
        });
    }






    /**
     * Llena toda la matriz con gemas de cruz  y al finalizar  muestraa la barra negra con el texto "GAME OVER"  
     */
    public animar_game_over(onTerminado?: () => void): void {
        const celdas: { fila: number; col: number }[] = [];

        for (let F = this.filas - 1; F >= 0; F--) {
            for (let C = 0; C < this.columnas; C++) {
                celdas.push({ fila: F, col: C });
            }
        }

        let indice = 0;
        this.scene.time.addEvent({
            delay: 25,
            repeat: celdas.length - 1,
            callback: () => {
                const { fila, col } = celdas[indice];

                // Si ya existía un sprite en esa celda  se destruye
                if (this.tablero[fila][col] !== null) {
                    this.tablero[fila][col]!.destroy();
                }

                // Coordenadas   exactas de la celda
                const pixelX = CONFIG_JUEGO.limites.izquierdo + col * CONFIG_JUEGO.tablero.anchoColumna;
                const pixelY = CONFIG_JUEGO.limites.superior + fila * CONFIG_JUEGO.tablero.anchoColumna;

                const nuevaCruz = this.scene.add.sprite(pixelX, pixelY, "atlas", "gema_cruz")
                    .setScale(CONFIG_JUEGO.escala)
                    .setOrigin(0, 0);

                this.tablero[fila][col] = nuevaCruz;
                indice++;

                // Al completar todas las celdas  desplegar el cartel de GAME OVER
                if (indice === celdas.length) {
                    this.mostrar_cartel_game_over();
                    if (onTerminado) onTerminado();
                }
            }
        });
    }

    // Dibuja la franja negra y las letras de "GAME OVER" en la fila 3 del pozo.

    private mostrar_cartel_game_over(): void {
        const filaObjetivo = 3;
        const pixelY = CONFIG_JUEGO.limites.superior + filaObjetivo * CONFIG_JUEGO.tablero.anchoColumna;
        const anchoPozo = this.columnas * CONFIG_JUEGO.tablero.anchoColumna;
        const centroX = CONFIG_JUEGO.limites.izquierdo + anchoPozo / 2;
        const centroY = pixelY + CONFIG_JUEGO.tablero.anchoColumna / 2;
        this.scene.add.rectangle(
            centroX,
            centroY,
            anchoPozo,
            11 * CONFIG_JUEGO.escala,
            0x000000
        ).setOrigin(0.5, 0.5);
        const patron = [
            "letra_G", "letra_A", "letra_M", "letra_E",
            null, null, null, null,
            "letra_O", "letra_V", "letra_E", "letra_R"
        ];
        const anchoBaldosa = 8 * CONFIG_JUEGO.escala;
        const inicioPozoX = CONFIG_JUEGO.limites.izquierdo;
        const spritesLetras: Phaser.GameObjects.Sprite[] = [];
        patron.forEach((clave, i) => {
            if (!clave) return;
            const sprite = this.scene.add.sprite(
                inicioPozoX + i * anchoBaldosa,
                centroY,
                "atlas",
                clave
            )
                .setScale(CONFIG_JUEGO.escala)
                .setOrigin(0, 0.5);
            spritesLetras.push(sprite);
        });

        //  Parpadeo continuo  
        let visible = true;
        this.scene.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => {
                visible = !visible;
                spritesLetras.forEach(s => s.setVisible(visible));
            }
        });
    }


    /**
     * Procesa el impacto de la columna mágica (gema_cruz):
     * 1. Detecta la gema sobre la que aterrizó.
     * 2. Reúne todas las gemas de ese color en el tablero + las 3 cruces.
     * 3. Anima el destello de eliminación y suma puntos.
     * 4. Aplica gravedad y resuelve combos encadenados.
     * 5. Al quedar en reposo, avanza de nivel y cambia el fondo.
     */
    public procesar_pieza_magica(pieza: piezas, onTerminado: () => void): void {
        const filaDebajo = pieza.fila_actual + 3;
        const col = pieza.columna_actual;
        const gemasAEliminar = new Set<Phaser.GameObjects.Sprite>();

        // Las 3 cruces mágicas siempre se eliminan
        pieza.gemasSprites.forEach((s: Phaser.GameObjects.Sprite) => gemasAEliminar.add(s));

        if (filaDebajo < this.filas && this.tablero[filaDebajo][col] !== null) {
            const colorObjetivo = this.tablero[filaDebajo][col]!.frame.name;

            for (let F = 0; F < this.filas; F++) {
                for (let C = 0; C < this.columnas; C++) {
                    const sprite = this.tablero[F][C];
                    if (sprite !== null && sprite.frame.name === colorObjetivo) {
                        gemasAEliminar.add(sprite);
                    }
                }
            }
        }

        const puntos = gemasAEliminar.size * CONFIG_JUEGO.puntuacion.puntosPorGema;
        this.marcador.mostrarPuntosFlotantes(puntos);

        this.animar_destello(gemasAEliminar, 1, () => {
            pieza.gemasSprites.forEach((s: Phaser.GameObjects.Sprite) => {
                s.destroy();
                gemasAEliminar.delete(s);
            });

            // Destruir las gemas del tablero y registrar en el marcador
            this.eliminar_bloque(gemasAEliminar);
            this.gravedad();

            // Resolver cascadas de combos secundarios si las hubiere
            this.procesar_tablero(() => {
                this.marcador.avanzarNivel();
                onTerminado();
            });
        });
    }


}










