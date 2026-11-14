# Magic Jewelry — Clon NES

Clon del clásico *Magic Jewelry* (NES, 1990) desarrollado en **TypeScript** con **Phaser 3** y **Vite**, optimizado para jugarse tanto en PC como en navegadores móviles.

**Autor:** `>ER;`  
**Propósito:** Proyecto desarrollado con fines estrictamente didácticos, de prueba y práctica de desarrollo.

---

## Características

* **Mecánica retro Match-3:** Conexiones en horizontal, vertical y diagonales con caída de gemas por gravedad.
* **Soporte multiplataforma:** Jugable en ordenador y teléfonos móviles con pantalla adaptativa (`Phaser.Scale.FIT`).
* **Controles táctiles:** Soporte de gestos (deslizar y toques) y botón de pausa en pantalla para móviles.

---

## Controles

| Acción | Teclado (PC) | Táctil (Móvil) |
| :--- | :--- | :--- |
| **Mover columna** | Flechas `←` / `→` | Deslizar izquierda / derecha |
| **Rotar gemas** | Tecla `Z` | Toque rápido (*Tap*) |
| **Caída rápida** | Flecha `↓` | Deslizar hacia abajo |
| **Pausa / Reanudar** | Tecla `ENTER` | Botón táctil `⏸` / `▶` |

---

## Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo
npm run dev

# 3. Compilar para producción (Vercel)
npm run build
```

---

## Créditos y Atribución

* **Concepto original:** *Magic Jewelry* (1990), creado por Hwang Shinwei / RCM Group.
* **Música y Audio:** Algunas pistas fueron obtenidas de YouTube y otras fueron de creación propia para este proyecto.
* **Desarrollo del clon:** Realizado por `>ER;` con fines educativos y de práctica.
