# Juego Accesible - Entrenamiento Mental para Adultos Mayores

¡Bienvenido/a a **Juego Accesible**! Esta es una aplicación web móvil interactiva especialmente diseñada para **adultos mayores (+65 años)** y personas que buscan entrenar su memoria y habilidades cognitivas en un entorno amigable, sin frustración y adaptado a sus necesidades visuales y motoras.

El proyecto está diseñado bajo la filosofía **"Mobile-First"** (optimizado para pantallas de teléfonos móviles) y puede jugarse directamente desde cualquier navegador web sin necesidad de descargas.

---

## 🔍 Características de Accesibilidad (UI/UX Inclusiva)

Para garantizar que la aplicación sea cómoda y fácil de usar para personas mayores, se han implementado las siguientes pautas de diseño inclusivo:

1. **Tipografía Clara y Legible:** Fuentes grandes (mínimo `18px` - `20px`) con tipografías sans-serif de alta legibilidad para facilitar la lectura.
2. **Botones e Interactividad Gigantes:** Los botones interactivos tienen un tamaño mínimo de `60px × 60px` y amplias áreas de contacto táctil, evitando clics accidentales.
3. **Alto Contraste Visual:** Una paleta de colores cuidadosamente seleccionada que asegura un contraste óptimo entre los textos y los fondos.
4. **Regla del Tiempo Amigable ("Cero Presión"):** 
   - El temporizador visual **solo aparece y avanza durante la fase de memorización**.
   - En el momento en que el usuario debe responder o jugar, **el tiempo se detiene por completo**, permitiéndole pensar y actuar a su propio ritmo sin estrés.
5. **Instrucciones Sin Límite de Tiempo:** Antes de iniciar cualquier juego, se presentan las instrucciones detalladas. El juego no comenzará hasta que el usuario pulse el botón **"¡Estoy listo!"**.
6. **Retroalimentación Agradable:** Si el usuario se equivoca, no se utilizan alarmas rojas agresivas ni mensajes de error frustrantes. En su lugar, se muestra un mensaje amable resaltando la respuesta correcta de forma visual para fomentar el aprendizaje continuo.
7. **Narración por Voz (Text-to-Speech):** La app incluye un reproductor con lectura de voz interactiva integrada para las historias introductorias, con controles de reproducción (pausar, reanudar e ir al inicio).
8. **Sonidos Sintetizados (Web Audio API):** Generación de sonidos interactivos dinámicos y amigables para respuestas correctas, parciales o erróneas, sin requerir la descarga de archivos de audio externos.

---

## 🎮 Modos de Juego

La aplicación consta de dos categorías principales de entrenamiento:

### 1. La Lista del Súper (Juego de Memoria Narrativo)
En este juego, el usuario escucha o lee una historia cotidiana sobre ir de compras y debe recordar los elementos de la lista. Cuenta con **tres niveles de dificultad**:
* **Fácil:** Recordar únicamente la lista de productos básicos.
* **Medio:** Recordar los productos y sus cantidades exactas (ej. *2 manzanas*).
* **Difícil:** Recordar los productos con unidades de medida específicas (ej. *3 libras de arroz*, *1 litro de leche*).

### 2. Entrenador Mental (Minijuegos Rápidos)
Una batería de 4 minijuegos cognitivos diseñados para estimular distintas funciones cerebrales con **15 segundos** de memorización inicial:
* **Secuencia de Colores:** Memorizar y repetir una secuencia de luces de colores al estilo "Simón dice".
* **Encuentra las Parejas:** El clásico juego de encontrar cartas duplicadas en una cuadrícula.
* **Matemáticas Rápidas:** Resolver y evaluar operaciones aritméticas sencillas (sumas y restas) en el tiempo que el usuario necesite.
* **La Palabra Intrusa:** Identificar cuál palabra de una lista no pertenece a la misma categoría semántica (ej. identificar *manzana* en una lista de herramientas).

---

## 🛠️ Tecnologías Utilizadas

Este proyecto se ha desarrollado utilizando tecnologías web estándar puras, asegurando velocidad y ligereza extrema:
* **HTML5:** Estructura semántica accesible.
* **CSS3 (Vanilla):** Estilo responsivo móvil, animaciones sutiles y diseño de alto contraste.
* **JavaScript (ES6+):** Lógica del juego, manejo del estado de la aplicación, control del sintetizador de voz nativo (`SpeechSynthesis`) y motor de audio sintetizado (`AudioContext`).

No utiliza frameworks pesados como React, Angular o Vue, lo que facilita su carga instantánea incluso en conexiones lentas.

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

Para jugar o desarrollar en tu computadora, sigue estos pasos:

1. **Clona el repositorio** en tu máquina local:
   ```bash
   git clone https://github.com/carlos-parreno/juego-accesible.git
   ```
2. **Accede a la carpeta** del proyecto:
   ```bash
   cd juego-accesible
   ```
3. **Abre el archivo `index.html`** directamente en tu navegador web preferido (haciendo doble clic en él o arrastrándolo a la ventana del navegador).
4. *(Opcional)* Si deseas usar un servidor de desarrollo local ligero, puedes usar extensiones como *Live Server* en VS Code o ejecutar desde tu terminal:
   ```bash
   npx serve .
   ```
