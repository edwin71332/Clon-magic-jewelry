import Phaser from "phaser";
import { CONFIG_JUEGO } from "./config-juego";

export const gemasname = [
  "gema_roja",
  "gema_amarilla",
  "gema_morada",
  "gema_naranja",
  "gema_azul",
  "gema_verde",
];
const gema_magica = ["gema_cruz", "gema_cruz", "gema_cruz"];


export class gemas {

  private scene: Phaser.Scene;


  gemas_sig!: Phaser.GameObjects.Sprite[];

  public proximaEsMagica: boolean = false;


  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }


  public Barajar(): string[] {
    const resultado: string[] = [];

    for (let i = 0; i < 3; i++) {

      resultado.push(Phaser.Utils.Array.GetRandom(gemasname))



    }

    return resultado;

  }

  public create(x: number, y: number, nombres?: string[]): Phaser.GameObjects.Sprite[] {

    const lista = nombres ?? this.Barajar();
    return lista
      .map((nombre, i) =>
        this.scene.add.sprite(
          x,
          y + i * CONFIG_JUEGO.tablero.anchoColumna,
          "atlas",
          nombre)
          .setScale(CONFIG_JUEGO.escala)
          .setOrigin(0, 0)
      );
  }

  // Crea  vista previa
  public crearPreview(): void {
    this.gemas_sig = this.create(
      CONFIG_JUEGO.tablero.GEMA_SIG_VIEW,
      CONFIG_JUEGO.tablero.anchoColumna
    );
  }

  // Lee la preview actual y genera la siguiente
  public siguientePieza(x: number, y: number): Phaser.GameObjects.Sprite[] {
    //   Si toca pieza mágica, se cuela directo al pozo  
    if (this.proximaEsMagica) {
      this.proximaEsMagica = false;
      return this.create(x, y, gema_magica);
    }
    // Flujo normal  la preview pasa al pozo y se baraja  una nueva preview
    const nombresActuales = this.gemas_sig.map(sprite => sprite.frame.name);
    const nuevosNombres = this.Barajar();
    this.gemas_sig.forEach((sprite, i) => {
      sprite.setFrame(nuevosNombres[i]);
    });
    return this.create(x, y, nombresActuales);
  }



}






