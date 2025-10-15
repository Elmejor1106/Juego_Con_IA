
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url" // Added net/url
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/rs/cors" // Importamos la librería CORS
)

// --- Estructuras (sin cambios) ---
type PexelsResponse struct {
	Photos []Photo `json:"photos"`
}
type Photo struct {
	ID  int         `json:"id"`
	Src PhotoSource `json:"src"`
}
type PhotoSource struct {
	Medium string `json:"medium"`
}
type GeminiResponse struct {
	Candidates []Candidate `json:"candidates"`
}
type Candidate struct {
	Content Content `json:"content"`
}
type Content struct {
	Parts []Part `json:"parts"`
}
type Part struct {
	Text string `json:"text"`
}
type GeminiRequest struct {
	Contents []Content `json:"contents"`
}

var (
	pexelsAPIKey string
	geminiAPIKey string
)

// --- Funciones de API (sin cambios) ---
func getKeywordsFromGemini(title string) ([]string, error) {
	apiURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=%s", geminiAPIKey)
	prompt := fmt.Sprintf("Extrae exactamente 3 palabras clave relevantes para una búsqueda de imágenes a partir de la siguiente pregunta de trivia. Responde únicamente con las palabras clave separadas por comas, en inglés. Pregunta: '%s'", title)
	reqBody := GeminiRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{Text: prompt},
				},
			},
		},
	}
	reqBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error al codificar el cuerpo de la petición a Gemini: %v", err)
	}
	resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(reqBytes))
	if err != nil {
		return nil, fmt.Errorf("error al realizar la petición a Gemini: %v", err)
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error al leer la respuesta de Gemini: %v", err)
	}
	var geminiResp GeminiResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return nil, fmt.Errorf("error al decodificar la respuesta de Gemini: %v", err)
	}
	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		keywordsText := geminiResp.Candidates[0].Content.Parts[0].Text
		keywords := strings.Split(keywordsText, ",")
		for i := range keywords {
			keywords[i] = strings.TrimSpace(keywords[i])
		}
		return keywords, nil
	}
	return nil, errors.New("no se recibieron palabras clave de Gemini")
}

func searchPexelsImages(query string) ([]string, error) {
	encodedQuery := url.QueryEscape(query)
	searchURL := fmt.Sprintf("https://api.pexels.com/v1/search?query=%s&per_page=3", encodedQuery)
	client := &http.Client{}
	req, err := http.NewRequest("GET", searchURL, nil)
	if err != nil {
		return nil, errors.New("error al crear la petición a Pexels")
	}
	req.Header.Add("Authorization", pexelsAPIKey)
	resp, err := client.Do(req)
	if err != nil {
		return nil, errors.New("error al realizar la petición a Pexels")
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, errors.New("error al leer la respuesta de Pexels")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("la API de Pexels devolvió un estado no esperado: %d, respuesta: %s", resp.StatusCode, string(body))
	}

	var pexelsResp PexelsResponse
	if err := json.Unmarshal(body, &pexelsResp); err != nil {
		return nil, errors.New("error al decodificar el JSON de Pexels")
	}
	var urls []string
	for _, photo := range pexelsResp.Photos {
		urls = append(urls, photo.Src.Medium)
	}
	return urls, nil
}

func suggestionsHandler(w http.ResponseWriter, r *http.Request) {
	title := r.URL.Query().Get("title")
	if title == "" {
		http.Error(w, "El parámetro 'title' es requerido", http.StatusBadRequest)
		return
	}
	log.Printf("Obteniendo palabras clave para: %s", title)
	keywords, err := getKeywordsFromGemini(title)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error con la API de Gemini: %v", err), http.StatusInternalServerError)
		return
	}
	log.Printf("Palabras clave recibidas: %v", keywords)

	allImageURLs := make(map[string]bool)
	for _, keyword := range keywords {
		imageURLs, err := searchPexelsImages(keyword)
		if err != nil {
			// Log the error but continue to the next keyword
			log.Printf("Error buscando imágenes para la palabra clave '%s': %v", keyword, err)
			continue
		}
		for _, url := range imageURLs {
			allImageURLs[url] = true
		}
	}

	// Convert map keys to a slice
	uniqueImageURLs := make([]string, 0, len(allImageURLs))
	for url := range allImageURLs {
		uniqueImageURLs = append(uniqueImageURLs, url)
	}

	log.Printf("Se encontraron %d imágenes únicas.", len(uniqueImageURLs))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(uniqueImageURLs)
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Advertencia: No se pudo encontrar el archivo .env")
	}
	pexelsAPIKey = os.Getenv("PEXELS_API_KEY")
	geminiAPIKey = os.Getenv("GEMINI_API_KEY")
	if pexelsAPIKey == "" || geminiAPIKey == "" {
		log.Fatal("Error: Claves de API no configuradas.")
	}

	// --- CONFIGURACIÓN DE RUTAS Y CORS ---
	mux := http.NewServeMux()
	mux.HandleFunc("/api/suggestions", suggestionsHandler)

	// Configuración de CORS: permitir cualquier origen para desarrollo
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3001"}, // O "*" para cualquiera
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
	})

	handler := c.Handler(mux)

	fmt.Println("Servidor de sugerencias escuchando en el puerto 8081...")
	log.Fatal(http.ListenAndServe(":8081", handler)) // Usamos el handler con CORS
}
