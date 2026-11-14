import Phaser from "phaser";
import { CONFIG_JUEGO } from "./config-juego";

export class Marcador {
    private scene: Phaser.Scene;

    // Sprites en pantalla
    private spritesScore: Phaser.GameObjects.Sprite[] = [];
    private spritesJoyas: Phaser.GameObjects.Sprite[] = [];
    private spritesLevel: Phaser.GameObjects.Sprite[] = [];

    public totalJoyas: number = 0;
    public score: number = 0;
    public nivelFondo: number = 0;

    // Bandera para avisar que la siguiente pieza debe ser mágica
    public hayMagicaPendiente: boolean = false;

    // Callback para avisarle a index.ts cuando toque cambiar el fondo
    public onCambioNivel?: (nuevoNivel: number) => void;


    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.crearDigitosScore();
        this.crearDigitosJoyas();
        this.crearDigitosLevel();
    }

    //  Crea los 7 dígitos de SCORE  
    private crearDigitosScore() {
        const { x, y, digitos } = CONFIG_JUEGO.ui.score;
        const pasoX = CONFIG_JUEGO.ui.pasoX;

        for (let i = 0; i < digitos; i++) {
            const sprite = this.scene.add.sprite(x + (i * pasoX), y, "atlas", "num_0")
                .setScale(CONFIG_JUEGO.escala)
                .setOrigin(0, 0);
            this.spritesScore.push(sprite);
        }
    }

    //   Crea los 5 dígitos de JEWELRY  
    private crearDigitosJoyas() {
        const { x, y, digitos } = CONFIG_JUEGO.ui.jewelry;
        const pasoX = CONFIG_JUEGO.ui.pasoX;

        for (let i = 0; i < digitos; i++) {
            const sprite = this.scene.add.sprite(x + (i * pasoX), y, "atlas", "num_0")
                .setScale(CONFIG_JUEGO.escala)
                .setOrigin(0, 0);
            this.spritesJoyas.push(sprite);
        }
    }

    //  Crea los 3 dígitos de LEVEL  
    private crearDigitosLevel() {
        const { x, y, digitos } = CONFIG_JUEGO.ui.level;
        const pasoX = CONFIG_JUEGO.ui.pasoX;

        for (let i = 0; i < digitos; i++) {
            const sprite = this.scene.add.sprite(x + (i * pasoX), y, "atlas", "num_0")
                .setScale(CONFIG_JUEGO.escala)
                .setOrigin(0, 0);
            this.spritesLevel.push(sprite);
        }
    }

    // Actualiza los 3 dígitos del nivel en pantalla
    private actualizarVisualLevel() {
        const textoLevel = this.nivelFondo.toString().padStart(3, "0");
        for (let i = 0; i < 3; i++) {
            this.spritesLevel[i].setFrame("num_" + textoLevel[i]);
        }
    }

    // Suma gemas destruidas y puntos al jugador

    public sumar(gemasDestruidas: number, multiplicadorCombo: number = 1) {


        this.totalJoyas += gemasDestruidas;
        const textoJoyas = this.totalJoyas.toString().padStart(5, "0");
        for (let i = 0; i < 5; i++) {
            this.spritesJoyas[i].setFrame("num_" + textoJoyas[i]);
        }

        //  Sumar puntos con multiplicador de combo
        const puntosGanados = (gemasDestruidas * CONFIG_JUEGO.puntuacion.puntosPorGema) * multiplicadorCombo;
        this.score += puntosGanados;
        const textoScore = this.score.toString().padStart(7, "0");
        for (let i = 0; i < 7; i++) {
            this.spritesScore[i].setFrame("num_" + textoScore[i]);
        }

        //  Cada 70 joyas destruidas, sube de nivel y avisa para cambiar fondo
        const nuevoNivel = Math.floor(this.totalJoyas / CONFIG_JUEGO.nivel.joyasPorNivel);
        if (nuevoNivel > this.nivelFondo && !this.hayMagicaPendiente) {
            this.hayMagicaPendiente = true;
        }
    }

    // Se llama cuando la gema magica terminó todo su impacto y no quedan gemas cayendo
    public avanzarNivel() {
        this.nivelFondo++;
        this.actualizarVisualLevel();
        this.hayMagicaPendiente = false;
        if (this.onCambioNivel) {
            this.onCambioNivel(this.nivelFondo);
        }
    }

    // Muestra los puntos flotando hacia la derecha durante el destello
    public mostrarPuntosFlotantes(puntos: number) {
        const conf = CONFIG_JUEGO.puntuacion.puntosFlotantes;

        const xInicial = CONFIG_JUEGO.limites.izquierdo + (conf.columnaInicial * CONFIG_JUEGO.ANCHO_COLUMNA);
        const yInicial = CONFIG_JUEGO.limites.superior + (conf.filaInicial * CONFIG_JUEGO.ANCHO_COLUMNA);
        const xFinal = CONFIG_JUEGO.limites.derecho + conf.margenSalidaX;

        const contenedor = this.scene.add.container(xInicial, yInicial);
        const texto = puntos.toString().padStart(conf.digitos, "0");
        const pasoX = CONFIG_JUEGO.ui.pasoX;

        for (let i = 0; i < texto.length; i++) {
            const sprite = this.scene.add.sprite(i * pasoX, 0, "atlas", "num_" + texto[i])
                .setScale(CONFIG_JUEGO.escala)
                .setOrigin(0, 0);
            contenedor.add(sprite);
        }

        this.scene.tweens.add({
            targets: contenedor,
            x: xFinal,
            duration: CONFIG_JUEGO.puntuacion.duracionDestelloMs,
            ease: "Linear",
            onComplete: () => {
                contenedor.destroy();
            }
        });
    }
}