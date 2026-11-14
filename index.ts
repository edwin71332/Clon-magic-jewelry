import Phaser from "phaser";
import { gemas } from "./src/gemas";
import { CONFIG_JUEGO } from "./src/config-juego";
import { piezas } from "./src/PIEZAS"
import { tablero } from "./src/tablero"
import { Marcador } from "./src/marcador";
import { fondos } from "./src/fondo";
import { sonidos } from "./src/sonidos";
import { inicio } from "./src/inicio";
import { ControlesTactiles } from "./src/controles-tactiles";


export class tetris extends Phaser.Scene {
  constructor() {
    super("MiJuego");
  }

  private control!: Phaser.Types.Input.Keyboard.CursorKeys;
  private teclaZ!: Phaser.Input.Keyboard.Key;
  private teclaEnter!: Phaser.Input.Keyboard.Key;
  private fondo!: fondos;
  private pieza!: piezas;
  private tablero!: tablero;
  private gemas!: gemas;
  private marcador!: Marcador;

  private musicaActual?: Phaser.Sound.BaseSound; // Referencia a la pista sonando
  private sonido!: sonidos;

  private enPausa: boolean = false;            // Bloqueo interno por animaciones/Game Over
  private juegoPausado: boolean = false;       // Pausa manual activada por el jugador
  private bloqueoBajada: boolean = false;      // Evita que la caída rápida se herede a la nueva pieza
  private caidaTimer!: Phaser.Time.TimerEvent; // Referencia al temporizador de caída automática
  private botonPausa?: Phaser.GameObjects.Text;
  private textoPausa?: Phaser.GameObjects.Text;


  x = CONFIG_JUEGO.ADD_GEMA_X
  y = CONFIG_JUEGO.ADD_GEMA_Y



  preload() {
    this.load.atlas(
      "atlas",
      "spritesheet.png",
      "spritesheet.json",
    );


    // Carga de efectos SFX
    this.load.audio("sfx_clear", "audio/clear.wav");
    this.load.audio("sfx_move", "audio/move.wav");
    this.load.audio("sfx_rotate", "audio/rotar.wav");
    this.load.audio("sfx_land", "audio/aterrizar.wav");

    // Carga primera pistas de música de fondo
    this.load.audio("musica_1", "audio/fondo (1).mp3");
  }



  create() {
    //carga las pistas restantes
    for (let i = 2; i <= CONFIG_JUEGO.nivel.totalPistasMusica; i++) {
      this.load.audio(`musica_${i}`, `audio/fondo (${i}).mp3`);
    }

    // Activa el control táctil para celulares
    new ControlesTactiles(this, {
      onMover: (dir) => {
        if (this.pieza.mover(dir, this.tablero)) this.sonido.playMove(false);
      },
      onRotar: () => {
        this.pieza.ROTAR();
        this.sonido.playRotate();
      },
      onBajarRapido: () => {
        this.bajarPieza(true);
      },
      puedeInteractuar: () => !this.enPausa && !this.juegoPausado,
    });

    this.load.start();
    this.fondo = new fondos(this);
    this.marcador = new Marcador(this);
    this.sonido = new sonidos(this);

    this.marcador.onCambioNivel = (nivel) => {
      this.fondo.cambiarNivel_fondo(nivel);
      this.reproducirMusicaNivel(nivel);
      this.actualizarVelocidadCaida(nivel);
    };

    // Inicia la música correspondiente al nivel 0
    this.reproducirMusicaNivel(0);

    this.tablero = new tablero(this, this.marcador, this.sonido);
    this.gemas = new gemas(this);
    this.gemas.crearPreview();
    this.pieza = new piezas(this.gemas.create(this.x, this.y));

    this.control = this.input.keyboard!.createCursorKeys();
    this.teclaZ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.teclaEnter = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);


    this.caidaTimer = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        this.bajarPieza();
      }
    });

    // Botón táctil para pausar/reanudar en celular
    this.botonPausa = this.add.text(485, 16, "⏸", {
      fontFamily: '"Lucida Console", Monaco, monospace',
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);

    this.botonPausa.on("pointerdown", () => {
      this.alternarPausa();
    });


  }

  update() {
    //Alternar pausa con ENTER en cualquier momento mientras no sea Game Ove 
    if (Phaser.Input.Keyboard.JustDown(this.teclaEnter)) {
      this.alternarPausa();
    }


    //  Si el juego está pausado por el usuario se congela todo el ciclo
    if (this.juegoPausado) return;


    //  Si el juego está   resolviendo animaciones  ignoramos controles
    if (this.enPausa) return;


    //  Liberar el bloqueo de bajada si el usuario soltó la flecha abajo
    if (this.control.down.isUp) {
      this.bloqueoBajada = false;
    }

    // Movimientos del jugador
    if (Phaser.Input.Keyboard.JustDown(this.control.left)) {
      if (this.pieza.mover(-1, this.tablero)) this.sonido.playMove(false);
    }
    if (Phaser.Input.Keyboard.JustDown(this.control.right)) {
      if (this.pieza.mover(1, this.tablero)) this.sonido.playMove(false);
    }
    if (Phaser.Input.Keyboard.JustDown(this.teclaZ)) {
      this.pieza.ROTAR();
      this.sonido.playRotate();
    }
    if (this.control.down.isDown && !this.bloqueoBajada) {
      this.bajarPieza(true);
    }

  }

  private alternarPausa(): void {
    if (this.pieza && this.pieza.fila_actual < 0 && this.enPausa) return;
    this.juegoPausado = !this.juegoPausado;
    this.caidaTimer.paused = this.juegoPausado;

    if (this.botonPausa) {
      this.botonPausa.setText(this.juegoPausado ? "▶" : "⏸");
    }

    if (this.juegoPausado) {
      this.textoPausa = this.add.text(this.scale.width / 2, this.scale.height / 2, "PAUSE", {
        fontFamily: '"Lucida Console", Monaco, monospace',
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 6,
        resolution: 2,
      }).setOrigin(0.5).setDepth(100);
    } else {
      if (this.textoPausa) {
        this.textoPausa.destroy();
        this.textoPausa = undefined;
      }
    }

    // Pausar o reanudar el audio según el estado de pausa
    if (this.musicaActual) {
      if (this.juegoPausado) {
        this.musicaActual.pause();
      } else {
        this.musicaActual.resume();
      }
    }
  }


  private bajarPieza(manual: boolean = false) {
    if (this.enPausa || this.juegoPausado) return;

    if (this.pieza.moveDOWN(this.tablero)) {
      this.aterrizarPieza();
    } else if (manual) {
      this.sonido.playMove(true);
    }
  }

  private aterrizarPieza() {
    this.enPausa = true;

    const alTerminarResolucion = () => {
      // Si la celda donde nace la siguiente pieza está ocupada, Game Over
      if (this.tablero.tablero[0][CONFIG_JUEGO.columna_inicial] !== null) {
        this.caidaTimer.remove();
        if (this.musicaActual) this.musicaActual.stop();
        this.sonido.detenerTodo();
        this.tablero.animar_game_over();
        return;
      }

      this.gemas.proximaEsMagica = this.marcador.hayMagicaPendiente;
      this.pieza = new piezas(this.gemas.siguientePieza(this.x, this.y));
      if (this.control.down.isDown) {
        this.bloqueoBajada = true;
      }
      this.enPausa = false;
    };

    if (this.pieza.esMagica) {
      this.tablero.procesar_pieza_magica(this.pieza, alTerminarResolucion);
    } else {
      this.tablero.fijar_pieza(this.pieza);
      const matches = this.tablero.buscar_matches();

      // Si la pieza quedó asomando por arriba Y no hizo ninguna combinación: Game Over
      if (this.pieza.fila_actual < 0 && (!matches || matches.size === 0)) {
        this.caidaTimer.remove();
        if (this.musicaActual) this.musicaActual.stop();
        this.sonido.detenerTodo();
        this.tablero.animar_game_over();
        return;
      }

      if (!matches || matches.size === 0) {
        this.sonido.playLand();
      }
      this.tablero.procesar_tablero(alTerminarResolucion);
    }
  }

  // Detiene la pista previa y arranca en bucle la del nuevo nivel
  private reproducirMusicaNivel(nivel: number): void {
    if (this.musicaActual) {
      this.musicaActual.stop();
    }

    const pista = (nivel % CONFIG_JUEGO.nivel.totalPistasMusica) + 1;
    this.musicaActual = this.sound.add(`musica_${pista}`, {
      loop: true,
      volume: CONFIG_JUEGO.audio.volumenMusica,
    });
    this.musicaActual.play();
  }


  // Calcula y reconfigura el temporizador de caída según el nivel
  private actualizarVelocidadCaida(nivel: number): void {
    const { delayBaseMs, reduccionPorNivelMs, delayMinimoMs } = CONFIG_JUEGO.dificultad;
    const nuevoDelay = Math.max(delayMinimoMs, delayBaseMs - (nivel * reduccionPorNivelMs));

    // Reconfigura el temporizador activo sin perder el bucle
    this.caidaTimer.reset({
      delay: nuevoDelay,
      callback: () => this.bajarPieza(),
      loop: true,
    });
  }

}



const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 512,
    height: 480,
  },
  backgroundColor: "#000",
  parent: "game",
  pixelArt: true,
  scene: [inicio, tetris],
  physics: {
    default: "arcade",
  },
};

new Phaser.Game(config);
