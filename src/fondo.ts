import Phaser from "phaser";
import { CONFIG_JUEGO } from "./config-juego";

export class fondos {
    private scene: Phaser.Scene;
    private imagenFondo: Phaser.GameObjects.Image;
    private spriteAntorcha: Phaser.GameObjects.Sprite;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;

        //  Imagen del fondo base
        this.imagenFondo = this.scene.add
            .image(0, this.scene.scale.height, "atlas", "pantalla_0")
            .setScale(CONFIG_JUEGO.escala)
            .setOrigin(0, 1)
            .setDepth(-1);

        //Elementos por detrás del fondo
        this.crearLuna();
        this.crearEstrellas();

        //Registrar 8 animaciones de llama 
        for (let i = 0; i < 8; i++) {
            const claveAnim = "fuego_antorcha_" + i;
            if (!this.scene.anims.exists(claveAnim)) {
                this.scene.anims.create({
                    key: claveAnim,
                    frames: [
                        { key: "atlas", frame: `antorcha_${i * 2}` },
                        { key: "atlas", frame: `antorcha_${i * 2 + 1}` }
                    ],
                    frameRate: 3,
                    repeat: -1
                });
            }
        }

        //  Sprite de la llama sobre la estatua
        this.spriteAntorcha = this.scene.add
            .sprite(157 * CONFIG_JUEGO.escala, 56 * CONFIG_JUEGO.escala, "atlas", "antorcha_0")
            .setScale(CONFIG_JUEGO.escala)
            .setOrigin(0, 0)
            .setDepth(0)
            .play("fuego_antorcha_0");
    }

    // Cambia la pantalla visual   según el nivel alcanzado.
    public cambiarNivel_fondo(nivel: number): void {
        const indiceFondo = nivel % CONFIG_JUEGO.nivel.totalFondos;
        this.imagenFondo.setFrame("pantalla_" + indiceFondo);
        this.spriteAntorcha.play("fuego_antorcha_" + indiceFondo);
    }

    //Hace cruzar la luna una sola vez por detrás del cielo nocturno.

    private crearLuna(): void {
        const escala = CONFIG_JUEGO.escala;
        const xPos = 215 * escala;       // Claro derecho del cielo
        const yInicial = 140 * escala;   // Punto de salida inferior
        const yFinal = -20 * escala;     // Desaparece por el borde superior
        const luna = this.scene.add
            .sprite(xPos, yInicial, "atlas", "luna")
            .setScale(escala)
            .setOrigin(0, 0)
            .setDepth(-2);
        this.scene.tweens.add({
            targets: luna,
            y: yFinal,
            duration: 25000,
            ease: "Linear",
            repeat: -1,        // Una sola luna a la vez en bucle
            repeatDelay: 8000, // Pausa fuera de pantalla antes de volver a salir desde abajo
            onRepeat: () => {
                luna.y = yInicial;
            }
        });
    }
    // Flujo continuo de estrellas ascendiendo y titilando
    private crearEstrellas(): void {
        const escala = CONFIG_JUEGO.escala;
        const totalEstrellas = 10;
        const yInferior = 140 * escala;  // Reaparición abajo
        const ySuperior = -10 * escala;  // Desaparición arriba
        for (let i = 0; i < totalEstrellas; i++) {
            const frameEstrella = "estrella_" + (i % 4);
            // Se distribuyen de inicio en diferentes alturas para que el cielo no empiece vacío
            const xInicial = Phaser.Math.Between(165, 245) * escala;
            const yInicial = Phaser.Math.Between(0, 140) * escala;
            const estrella = this.scene.add
                .sprite(xInicial, yInicial, "atlas", frameEstrella)
                .setScale(escala)
                .setOrigin(0, 0)
                .setDepth(-2);
            // Titileo de brillo individual
            this.scene.tweens.add({
                targets: estrella,
                alpha: { from: 1, to: 0.15 },
                duration: 200 + (i % 3) * 150,
                yoyo: true,
                repeat: -1
            });

            // Función recursiva que eleva la estrella y la recicla abajo al llegar al tope
            const elevarEstrella = (sprite: Phaser.GameObjects.Sprite, yDesde: number) => {
                const distancia = yDesde - ySuperior;
                const velocidad = Phaser.Math.Between(16, 26); // Píxeles por segundo
                const duracion = (distancia / velocidad) * 1000;
                this.scene.tweens.add({
                    targets: sprite,
                    y: ySuperior,
                    duration: duracion,
                    ease: "Linear",
                    onComplete: () => {
                        sprite.x = Phaser.Math.Between(165, 245) * escala;
                        sprite.y = yInferior;
                        elevarEstrella(sprite, yInferior);
                    }
                });
            };
            elevarEstrella(estrella, yInicial);
        }
    }
}