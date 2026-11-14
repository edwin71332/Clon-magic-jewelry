import Phaser from "phaser";
import { CONFIG_JUEGO } from "./config-juego";
import { tablero } from "./tablero";

export class piezas {

    gemasSprites: Phaser.GameObjects.Sprite[];

    columna_actual: number = CONFIG_JUEGO.columna_inicial;
    fila_actual: number = CONFIG_JUEGO.fila_inicial - 3;

    public esMagica: boolean = false; // Identifica si la columna es la pieza de cruces

    constructor(sprites: Phaser.GameObjects.Sprite[]) {
        this.gemasSprites = sprites;
        this.esMagica = sprites.length > 0 && sprites[0].frame.name === "gema_cruz";
    }


    public mover(dir: -1 | 1, tablero: tablero): boolean {
        if (!tablero.hay_vecinos(dir, this)) {
            this.gemasSprites.forEach(elemento => {
                elemento.x += (dir * CONFIG_JUEGO.tablero.anchoColumna);
            });
            this.columna_actual += dir;
            return true;
        }
        return false;
    }

    public moveDOWN(tablero: tablero): boolean {
        if (tablero.Hay_suelo(this)) return true;

        this.gemasSprites.forEach(elemento => {
            elemento.y += CONFIG_JUEGO.MOVIMIENTO_DOWN;
        })
        this.fila_actual++;
        return false;



    }



    public ROTAR() {
        const ultima = this.gemasSprites[2].frame.name;
        this.gemasSprites[2].setFrame(this.gemasSprites[1].frame.name);
        this.gemasSprites[1].setFrame(this.gemasSprites[0].frame.name);
        this.gemasSprites[0].setFrame(ultima);
    }

    /*     */

}