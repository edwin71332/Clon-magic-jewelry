# entorno_magic_jewelry.py
# Entorno de simulación matemático para Magic Jewelry usando Gymnasium y NumPy.
# Incluye simulación de la Gema Mágica (cruces) y recompensa por adyacencia de colores.

import gymnasium as gym
from gymnasium import spaces
import numpy as np


class EntornoMagicJewelry(gym.Env):
    """
    Entorno de simulación para entrenar agentes de Aprendizaje por Refuerzo (RL)
    en el videojuego Magic Jewelry (NES, 1990).
    
    Replica la lógica matemática de tablero.ts, incluyendo:
    - 6 colores estándar de gemas (1 a 6) y la Gema Mágica (7).
    - Detección de combinaciones Match-3 en 4 direcciones y cascadas.
    - Mecánica de la Gema Mágica: elimina todo el color sobre el que aterriza.
    - Recompensa por adyacencia: incentivo temprano al conectar colores vecinos.
    """

    metadata = {"render_modes": ["ansi"]}

    FILAS = 13
    COLUMNAS = 6
    NUM_COLORES_ESTANDAR = 6
    COLOR_GEMA_MAGICA = 7      # Identificador de la pieza de cruces
    PUNTOS_POR_GEMA = 30
    JOYAS_POR_NIVEL = 70       # Cada 70 gemas destruidas aparece una gema mágica

    def __init__(self):
        super().__init__()

        # Espacio de acciones discretas: 18 decisiones posibles
        # 6 columnas x 3 rotaciones
        self.action_space = spaces.Discrete(18)

        # Espacio de observación:
        # 78 celdas tablero + 3 gema actual + 3 gema siguiente = 84 valores normalizados [0.0, 1.0]
        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(84,),
            dtype=np.float32
        )

        self.tablero = np.zeros((self.FILAS, self.COLUMNAS), dtype=np.int8)
        self.pieza_actual = np.zeros(3, dtype=np.int8)
        self.pieza_siguiente = np.zeros(3, dtype=np.int8)

        # Control de niveles y aparición de gema mágica
        self.gemas_destruidas = 0
        self.siguiente_umbral_magica = self.JOYAS_POR_NIVEL
        self.proxima_es_magica = False

        # Métricas de la partida
        self.puntaje_acumulado = 0
        self.piezas_colocadas = 0

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.tablero.fill(0)
        self.puntaje_acumulado = 0
        self.piezas_colocadas = 0
        self.gemas_destruidas = 0
        self.siguiente_umbral_magica = self.JOYAS_POR_NIVEL
        self.proxima_es_magica = False

        self.pieza_actual = self._generar_pieza_aleatoria()
        self.pieza_siguiente = self._generar_pieza_aleatoria()

        return self._obtener_observacion(), {}

    def step(self, action: int):
        columna = action // 3
        rotacion = action % 3

        # 1. Rotar la pieza si no es mágica (las 3 cruces son idénticas, rotar no cambia nada)
        es_magica = (self.pieza_actual[0] == self.COLOR_GEMA_MAGICA)
        if not es_magica:
            pieza_rotada = self._rotar_pieza(self.pieza_actual, rotacion)
        else:
            pieza_rotada = self.pieza_actual.copy()

        # Copia previa del tablero para evaluar conexiones adyacentes recién creadas
        tablero_previo = self.tablero.copy()

        # 2. Soltar la columna en la cuadrícula
        filas_ocupadas, desborde = self._colocar_y_caer(columna, pieza_rotada)
        self.piezas_colocadas += 1

        # 3. Calcular la recompensa intermedia (migaja de pan) por adyacencia de colores
        bonus_adyacencia = 0.0
        if not es_magica and not desborde:
            conexiones_pares = self._contar_conexiones_adyacentes(filas_ocupadas, columna, tablero_previo)
            # Cada conexión de 2 colores iguales otorga 1/4 del valor de una gema (30 / 4 = 7.5 pts -> 0.75 en recompensa)
            bonus_adyacencia = conexiones_pares * (self.PUNTOS_POR_GEMA * 0.25 * 0.1)

        # 4. Procesar el impacto de la pieza (Mágica vs Estándar)
        if es_magica:
            gemas_eliminadas, puntos_turno = self._procesar_impacto_magica(filas_ocupadas, columna)
        else:
            gemas_eliminadas, puntos_turno = self._resolver_cascadas()

        # 5. Comprobación de fin de partida (Game Over)
        terminado = False
        if desborde and gemas_eliminadas == 0:
            terminado = True
        elif self.tablero[0, 3] != 0:
            terminado = True

        # 6. Cálculo de la función de recompensa total
        recompensa = self._calcular_recompensa(
            puntos_turno=puntos_turno,
            gemas_eliminadas=gemas_eliminadas,
            bonus_adyacencia=bonus_adyacencia,
            terminado=terminado
        )

        self.puntaje_acumulado += puntos_turno
        self.gemas_destruidas += gemas_eliminadas

        # 7. Programar la gema mágica si se alcanzó el umbral de 70 gemas destruidas
        if self.gemas_destruidas >= self.siguiente_umbral_magica:
            self.proxima_es_magica = True
            # Avanza al siguiente múltiplo de 70
            while self.siguiente_umbral_magica <= self.gemas_destruidas:
                self.siguiente_umbral_magica += self.JOYAS_POR_NIVEL

        # 8. Siguiente turno: avanzar preview y barajar
        if not terminado:
            self.pieza_actual = self.pieza_siguiente.copy()
            if self.proxima_es_magica:
                self.pieza_siguiente = np.array([self.COLOR_GEMA_MAGICA] * 3, dtype=np.int8)
                self.proxima_es_magica = False
            else:
                self.pieza_siguiente = self._generar_pieza_aleatoria()

        info = {
            "puntaje": self.puntaje_acumulado,
            "piezas": self.piezas_colocadas,
            "gemas_destruidas": self.gemas_destruidas,
            "es_magica": es_magica
        }

        return self._obtener_observacion(), recompensa, terminado, False, info

    def _generar_pieza_aleatoria(self) -> np.ndarray:
        return self.np_random.integers(1, self.NUM_COLORES_ESTANDAR + 1, size=3, dtype=np.int8)

    def _rotar_pieza(self, pieza: np.ndarray, rotacion: int) -> np.ndarray:
        if rotacion == 0:
            return pieza.copy()
        elif rotacion == 1:
            return np.array([pieza[2], pieza[0], pieza[1]], dtype=np.int8)
        else:
            return np.array([pieza[1], pieza[2], pieza[0]], dtype=np.int8)

    def _colocar_y_caer(self, columna: int, pieza: np.ndarray):
        fila_primer_bloque = self.FILAS
        for f in range(self.FILAS):
            if self.tablero[f, columna] != 0:
                fila_primer_bloque = f
                break

        fila_asiento = fila_primer_bloque - 1
        desborde = False
        filas_ocupadas = []

        for i in range(3):
            fila_destino = fila_asiento - i
            gema = pieza[2 - i]
            if fila_destino >= 0:
                self.tablero[fila_destino, columna] = gema
                filas_ocupadas.append(fila_destino)
            else:
                desborde = True

        return filas_ocupadas, desborde

    def _contar_conexiones_adyacentes(self, filas_ocupadas: list, columna: int, tablero_previo: np.ndarray) -> int:
        """
        Calcula cuántas gemas recién colocadas quedaron en contacto adyacente (ortogonal o diagonal)
        con gemas preexistentes del mismo color, fomentando la preparación de tríos en las 4 direcciones.
        """
        conexiones = 0
        direcciones = [
            (-1, 0), (1, 0), (0, -1), (0, 1),   # Ortogonales: Arriba, abajo, izquierda, derecha
            (-1, -1), (-1, 1), (1, -1), (1, 1)  # Diagonales: 4 esquinas
        ]

        for f in filas_ocupadas:
            color = self.tablero[f, columna]
            if color == 0:
                continue

            for df, dc in direcciones:
                nf, nc = f + df, columna + dc
                if 0 <= nf < self.FILAS and 0 <= nc < self.COLUMNAS:
                    # Solo premiamos si el vecino ya estaba colocado antes en el tablero
                    if tablero_previo[nf, nc] == color:
                        conexiones += 1

        return conexiones

    def _procesar_impacto_magica(self, filas_ocupadas: list, columna: int):
        """
        Ejecuta el impacto de la gema de cruces mágicas:
        Identifica el color de la gema sobre la que aterriza y destruye todas las gemas
        de ese mismo color en el tablero completo + las 3 cruces, aplicando gravedad.
        """
        if not filas_ocupadas:
            return 0, 0

        # La celda directamente debajo de la última cruz de la pieza
        fila_asiento = max(filas_ocupadas)
        fila_debajo = fila_asiento + 1

        gemas_eliminadas_color = 0
        if fila_debajo < self.FILAS:
            color_objetivo = self.tablero[fila_debajo, columna]
            if color_objetivo != 0 and color_objetivo != self.COLOR_GEMA_MAGICA:
                mascara_color = (self.tablero == color_objetivo)
                gemas_eliminadas_color = int(np.sum(mascara_color))
                self.tablero[mascara_color] = 0

        # Eliminar las 3 cruces mágicas
        self.tablero[self.tablero == self.COLOR_GEMA_MAGICA] = 0
        self._aplicar_gravedad()

        total_destruidas = gemas_eliminadas_color + 3
        puntos_magica = total_destruidas * self.PUNTOS_POR_GEMA

        # Resolver cascadas secundarias que pudieran desencadenarse tras la limpieza
        gemas_cascadas, puntos_cascadas = self._resolver_cascadas()

        return (total_destruidas + gemas_cascadas), (puntos_magica + puntos_cascadas)

    def _buscar_matches(self) -> set:
        gemas_a_eliminar = set()
        for f in range(self.FILAS):
            for c in range(self.COLUMNAS):
                color = self.tablero[f, c]
                if color == 0 or color == self.COLOR_GEMA_MAGICA:
                    continue

                if c + 2 < self.COLUMNAS and color == self.tablero[f, c + 1] == self.tablero[f, c + 2]:
                    gemas_a_eliminar.update({(f, c), (f, c + 1), (f, c + 2)})

                if f + 2 < self.FILAS and color == self.tablero[f + 1, c] == self.tablero[f + 2, c]:
                    gemas_a_eliminar.update({(f, c), (f + 1, c), (f + 2, c)})

                if f + 2 < self.FILAS and c + 2 < self.COLUMNAS and color == self.tablero[f + 1, c + 1] == self.tablero[f + 2, c + 2]:
                    gemas_a_eliminar.update({(f, c), (f + 1, c + 1), (f + 2, c + 2)})

                if f + 2 < self.FILAS and c - 2 >= 0 and color == self.tablero[f + 1, c - 1] == self.tablero[f + 2, c - 2]:
                    gemas_a_eliminar.update({(f, c), (f + 1, c - 1), (f + 2, c - 2)})

        return gemas_a_eliminar

    def _aplicar_gravedad(self):
        for c in range(self.COLUMNAS):
            columna_datos = self.tablero[:, c]
            gemas_vivas = columna_datos[columna_datos != 0]
            cantidad_ceros = self.FILAS - len(gemas_vivas)
            self.tablero[:cantidad_ceros, c] = 0
            self.tablero[cantidad_ceros:, c] = gemas_vivas

    def _resolver_cascadas(self):
        total_gemas_destruidas = 0
        puntos_totales = 0
        paso_combo = 1

        while True:
            matches = self._buscar_matches()
            if not matches:
                break

            cantidad = len(matches)
            total_gemas_destruidas += cantidad
            puntos_totales += cantidad * self.PUNTOS_POR_GEMA * paso_combo

            for f, c in matches:
                self.tablero[f, c] = 0

            self._aplicar_gravedad()
            paso_combo += 1

        return total_gemas_destruidas, puntos_totales

    def _calcular_recompensa(self, puntos_turno: int, gemas_eliminadas: int, bonus_adyacencia: float, terminado: bool) -> float:
        if terminado:
            return -100.0

        recompensa = (puntos_turno * 0.1) + bonus_adyacencia + 1.0

        alturas = [
            self.FILAS - np.argmax(self.tablero[:, c] != 0)
            if np.any(self.tablero[:, c] != 0) else 0
            for c in range(self.COLUMNAS)
        ]
        altura_maxima = max(alturas)
        if altura_maxima > 8:
            recompensa -= (altura_maxima - 8) * 0.5

        return float(recompensa)

    def _obtener_observacion(self) -> np.ndarray:
        # Normalizamos dividiendo entre 7.0 para incluir el color 7 (Gema Mágica)
        tablero_norm = (self.tablero.flatten() / float(self.COLOR_GEMA_MAGICA)).astype(np.float32)
        pieza_actual_norm = (self.pieza_actual / float(self.COLOR_GEMA_MAGICA)).astype(np.float32)
        pieza_sig_norm = (self.pieza_siguiente / float(self.COLOR_GEMA_MAGICA)).astype(np.float32)

        return np.concatenate([tablero_norm, pieza_actual_norm, pieza_sig_norm])
