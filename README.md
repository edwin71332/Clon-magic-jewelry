# Magic Jewelry (NES, 1990) — Clon con Agente Autónomo de Deep RL (Edge AI)

Clon del clásico *Magic Jewelry* (NES, 1990) desarrollado en **TypeScript**, **Phaser 3** y **Vite**, integrado con un agente autónomo de **Aprendizaje por Refuerzo Profundo (Deep RL)** entrenado mediante **PPO (Proximal Policy Optimization)** y ejecutado en el cliente web mediante **ONNX Runtime Web** y **WebAssembly (WASM)**.

**Autor:** `>ER;`  
**Propósito:** Proyecto didáctico, experimental que combina desarrollo de videojuegos retro con Inteligencia Artificial aplicada en el navegador (*Edge AI*).

---

## 🎮 Modos de Juego y Controles

El juego cuenta con un interruptor dinámico para alternar entre control humano y piloto automático en cualquier momento:

| Acción | Teclado (PC) | Táctil (Móvil) |
| :--- | :--- | :--- |
| **Alternar Modo IA / Jugador** | Tecla `I` | Botón táctil `[ 🎮 JUGADOR ]` / `[ 🤖 MODO IA ]` |
| **Mover columna** | Flechas `←` / `→` | Deslizar izquierda / derecha |
| **Rotar gemas** | Tecla `Z` | Toque rápido (*Tap*) |
| **Caída rápida** | Flecha `↓` | Deslizar hacia abajo |
| **Pausa / Reanudar** | Tecla `ENTER` | Botón táctil `⏸` / `▶` |


## 🧠 Arquitectura de Inteligencia Artificial (Edge AI)

El sistema opera bajo una **arquitectura híbrida client-side** sin servidores backend ni llamadas a APIs externas:

1. **Entrenamiento en Python (Kaggle)**:
   - Entorno personalizado Gymnasium (`ia/entorno_magic_jewelry.py`) con simulación matemática de gravedad, cascadas y Gema Mágica.
   - Algoritmo PPO (Stable-Baselines3) entrenado durante millones de pasos y exportado a formato abierto `.onnx`.
2. **Inferencia en el Navegador (TypeScript / WebAssembly)**:
   - Motor `onnxruntime-web` con compilación WASM SIMD ejecutando inferencias en 2–5 ms.
   - **Lookahead Táctico de 1 paso**: Simulación exhaustiva en memoria RAM de las 18 decisiones posibles (6 columnas × 3 rotaciones) para verificar matches inmediatos, evitar oclusión de pares y descartar líneas inviables contra los bordes.


---

## 🔬 Estudio Comparativo de Experimentos (A a E)

Se realizó un estudio progresivo compuesto por 5 ciclos de experimentación (cuadernos disponibles en `ia/`):

| Exp. | Arquitectura | Vector Entrada | Pasos | Enfoque / Hipótesis | Récord Gemas | Récord Puntos | Conclusión Técnica |
| :---: | :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **A** | MLP 2 capas × 128 | 84 | 2.0M | **Línea Base**: PPO estándar con recompensa por match-3, adyacencia y supervivencia. | 307 | 12.060 | Prueba de concepto viable. El agente domina la mecánica básica pero sufre de rascacielos prematuros. |
| **B** | MLP 3 capas × 128 | 84 | 3.5M | **Escalado de Capas**: Aumento de profundidad jerárquica para modelar patrones espaciales complejos. | 329 | 16.290 | La mayor capacidad representacional superó la meseta de 12k pts (+35% de mejora). |
| **C** | MLP 3 capas × 128 | 84 | 3.5M | **Reward Shaping Agresivo**: Penalización continua de altura desde la fila 1. | 260 | 10.253 | **Regresión por incentivo perverso (*Reward Hacking*)**: la penalización temprana superó el bono de vida, provocando suicidios deliberados. |
| **D** | MLP 3 capas × 128 | 84 | 3.5M | **Reward Shaping Calibrado**: Umbral de peligro a partir de la fila 8 con penalización cuadrática. | 306 | 10.220 | **Récord de consistencia media** (26.1 gemas/partida). Resolvió los suicidios y estabilizó partidas largas. |
| **E** | MLP 3 capas × 128 | **95** | 3.5M | **Feature Engineering**: Inyección de 6 alturas explícitas y 5 desniveles (*bumpiness*) entre columnas. | **388** | **17.840** | **Récord histórico absoluto (Nivel 5.54)**. Al recibir la topografía explícita, la red optimizó la supervivencia plana de largo plazo. |



## 🚀 Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

---

## 📜 Créditos y Atribución

* **Concepto original:** *Magic Jewelry* (1990), desarrollado por Hwang Shinwei / RCM Group.
* **Música:** Música original del videojuego, extraída de YouTube.
* **Efectos de sonido:** Creados para este proyecto.
* **Desarrollo del Clon y Pipeline de Machine Learning:** Realizado por `>ER;`.
