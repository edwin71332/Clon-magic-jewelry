import Phaser from "phaser";

export interface CallbacksTactiles {
    onMover: (direccion: 1 | -1) => void;
    onRotar: () => void;
    onBajarRapido: () => void;
    puedeInteractuar: () => boolean;
}

export class ControlesTactiles {
    private scene: Phaser.Scene;
    private callbacks: CallbacksTactiles;

    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private touchStartTime: number = 0;
    private touchLastX: number = 0;
    private touchLastY: number = 0;

    // Umbrales mínimos en píxeles para reconocer gestos
    private readonly UMBRAL_X: number = 22;
    private readonly UMBRAL_Y: number = 14; // Reducido para alta reactividad al bajar

    constructor(scene: Phaser.Scene, callbacks: CallbacksTactiles) {
        this.scene = scene;
        this.callbacks = callbacks;
        this.registrarEventos();
    }

    private registrarEventos(): void {
        this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (!this.callbacks.puedeInteractuar()) return;
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
            this.touchLastX = pointer.x;
            this.touchLastY = pointer.y;
            this.touchStartTime = this.scene.time.now;
        });

        this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
            if (!pointer.isDown || !this.callbacks.puedeInteractuar()) return;

            const deltaX = pointer.x - this.touchLastX;
            const deltaY = pointer.y - this.touchLastY;

            // Deslizamiento horizontal: mover columna
            if (Math.abs(deltaX) >= this.UMBRAL_X) {
                const pasos = Math.floor(Math.abs(deltaX) / this.UMBRAL_X);
                const dir: 1 | -1 = deltaX > 0 ? 1 : -1;
                for (let i = 0; i < pasos; i++) {
                    this.callbacks.onMover(dir);
                }
                this.touchLastX += dir * pasos * this.UMBRAL_X;
            }

            // Deslizamiento vertical hacia abajo: caída rápida continua y sensible
            if (deltaY >= this.UMBRAL_Y) {
                const pasos = Math.floor(deltaY / this.UMBRAL_Y);
                for (let i = 0; i < pasos; i++) {
                    this.callbacks.onBajarRapido();
                }
                this.touchLastY += pasos * this.UMBRAL_Y;
            }
        });

        this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
            if (!this.callbacks.puedeInteractuar()) return;

            const duracion = this.scene.time.now - this.touchStartTime;
            const distancia = Phaser.Math.Distance.Between(
                this.touchStartX,
                this.touchStartY,
                pointer.x,
                pointer.y
            );

            // Tap rápido y sin apenas desplazamiento: rotar gemas
            if (duracion < 220 && distancia < 16) {
                this.callbacks.onRotar();
            }
        });
    }
}