# Servicio de Sugerencias de Imágenes (Go)

Este microservicio en Go genera sugerencias de imágenes para preguntas de un juego de trivia.

## Funcionalidad

1.  Recibe una pregunta de trivia a través de una API REST.
2.  Utiliza la API de Google Gemini para extraer palabras clave relevantes de la pregunta.
3.  Utiliza la API de Pexels para buscar imágenes basadas en esas palabras clave.
4.  Devuelve una lista de URLs de imágenes sugeridas.

## Cómo ejecutarlo

### 1. Prerrequisitos

- Tener [Go](https://golang.org/dl/) instalado.

### 2. Configuración

a. Crea un archivo de entorno. Para ello, simplemente renombra el archivo `.env.example` a `.env`.

b. Edita el archivo `.env` y añade tus claves de API de Pexels y Gemini.

### 3. Ejecución

a. Abre una terminal en el directorio `image-suggestion-service`.

b. **Importante:** Para que el programa pueda leer el archivo `.env`, primero necesitas una librería. Ejecuta el siguiente comando para instalarla:
   ```bash
   go get github.com/joho/godotenv
   ```

c. Ejecuta el siguiente comando para iniciar el servidor:
   ```bash
   go run main.go
   ```

d. El servidor estará escuchando en `http://localhost:8081`.

## Endpoint de la API

- **GET /api/suggestions**
- **Parámetros de consulta:**
    - `title` (requerido): La pregunta de trivia para la cual se generarán sugerencias.
- **Ejemplo de uso:**
  `http://localhost:8081/api/suggestions?title=¿Quién fue el primer presidente de Estados Unidos?`
