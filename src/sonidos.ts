import Phaser from "phaser";
import { CONFIG_JUEGO } from "./config-juego";

export class sonidos {
    private scene: Phaser.Scene;
    private sfxActual?: Phaser.Sound.BaseSound;

    private readonly VOLUMEN_SFX = CONFIG_JUEGO.audio.volumenSfx;

    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // Regla de canal único: corta en seco cualquier SFX previo antes de disparar el nuevo
    private reproducir(clave: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
        if (!this.scene.cache.audio.exists(clave)) {
            return;

        }

        if (this.sfxActual && this.sfxActual.isPlaying) {
            this.sfxActual.stop();
        }

        this.sfxActual = this.scene.sound.add(clave, {
            volume: this.VOLUMEN_SFX,
            ...config
        });
        this.sfxActual.play();
    }

    // Movimiento lateral  
    public playMove(esRapido: boolean = false): void {
        this.reproducir("sfx_move", {
            rate: esRapido ? 1.1 : 1.0
        });
    }

    // Rotar  ciclar gemas  
    public playRotate(): void {
        this.reproducir("sfx_rotate", {
            rate: 1.0
        });
    }

    // Encajar columna en el fondo 
    public playLand(): void {
        this.reproducir("sfx_land", {
            rate: 1.0
        });
    }

    // Destello de 8 ticks con subida de tono y multiplicador de combo
    public playClear(chainStep: number, tick: number): void {
        const rate = 1.0 + ((chainStep - 1) * 0.15) + (tick * 0.05);
        this.reproducir("sfx_clear", {
            rate: rate
        });
    }

    public detenerTodo(): void {
        if (this.sfxActual && this.sfxActual.isPlaying) {
            this.sfxActual.stop();
        }
    }
}