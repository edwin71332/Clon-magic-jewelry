import Phaser from "phaser";
import { CONFIG_JUEGO } from "./config-juego";
import { gemasname } from "./gemas";

export class inicio extends Phaser.Scene {
    constructor() {
        super("inicio");
    }

    private spritesJ: Phaser.GameObjects.Sprite[] = [];
    private indiceColor: number = 0;
    private teclaEnter!: Phaser.Input.Keyboard.Key;

    // Matriz de 7 filas x 6 columnas que calca exactamente la "J" 
    private readonly MATRIZ_J: number[][] = [
        [0, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 1, 1],
        [1, 1, 0, 0, 1, 1],
        [0, 1, 1, 1, 1, 1],
    ];

    preload(): void {
        this.load.atlas("atlas", "spritesheet.png", "spritesheet.json");
        this.load.audio("sfx_start", "audio/rotar.wav");
    }

    create(): void {
        const escala = CONFIG_JUEGO.escala;
        const tamGema = CONFIG_JUEGO.tablero.anchoColumna;

        const inicioX = (this.scale.width - (6 * tamGema)) / 2;
        const inicioY = 40;

        for (let fila = 0; fila < this.MATRIZ_J.length; fila++) {
            for (let col = 0; col < this.MATRIZ_J[fila].length; col++) {
                if (this.MATRIZ_J[fila][col] === 1) {
                    const posX = inicioX + (col * tamGema);
                    const posY = inicioY + (fila * tamGema);

                    const sprite = this.add.sprite(posX, posY, "atlas", gemasname[0])
                        .setScale(escala)
                        .setOrigin(0, 0);

                    this.spritesJ.push(sprite);
                }
            }
        }

        // Bucle cromático de gemas 
        this.time.addEvent({
            delay: 450,
            loop: true,
            callback: () => {
                this.indiceColor = (this.indiceColor + 1) % gemasname.length;
                const nuevoColor = gemasname[this.indiceColor];
                this.spritesJ.forEach(s => s.setFrame(nuevoColor));
            }
        });

        const estiloTextoBase: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: '"Lucida Console", Monaco, monospace',
            fontSize: "18px",
            fontStyle: "bold",
            align: "center",
            resolution: 2,
        };

        this.add.text(this.scale.width / 2, 280, "MAGIC JEWELRY", {
            ...estiloTextoBase,
            fontSize: "20px",
            color: "#ffffff"
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, 312, "CLON POR >ER;", {
            ...estiloTextoBase,
            fontSize: "16px",
            color: "#00e5ff"
        }).setOrigin(0.5);

        this.add.text(this.scale.width / 2, 342, "ORIGINAL ©1990 RCM / HWANG SHINWEI", {
            ...estiloTextoBase,
            fontSize: "11px",
            color: "#ffcc00"
        }).setOrigin(0.5);

        // Texto parpadeante de inicio
        const textoStart = this.add.text(this.scale.width / 2, 410, "PRESS ENTER TO START", {
            ...estiloTextoBase,
            fontSize: "18px",
            color: "#ffffff"
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                textoStart.setVisible(!textoStart.visible);
            }
        });

        this.teclaEnter = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        // Permite también iniciar tocando la pantalla con el dedo o clic
        this.input.on("pointerdown", () => this.empezarPartida());
    }

    update(): void {
        if (Phaser.Input.Keyboard.JustDown(this.teclaEnter)) {
            this.empezarPartida();
        }
    }

    private empezarPartida(): void {
        if (this.cache.audio.exists("sfx_start")) {
            this.sound.play("sfx_start", { volume: 0.8 });
        }
        this.scene.start("MiJuego");
    }
}
