# Source Finder

A relevance-ranked academic paper search tool powered by semantic similarity and AI summaries.

## Overview

Source Finder helps researchers quickly find relevant academic papers by combining semantic understanding with metadata signals. Rather than simple keyword matching, it uses embedding-based similarity to rank papers by how well they match your research query, then optionally provides AI-generated appraisals of each result.

## Features

- **Semantic Relevance Ranking**: Uses `all-MiniLM-L6-v2` embeddings to compute cosine similarity between your query and paper abstracts
- **Composite Scoring**: Combines three signals:
  - 70% semantic similarity (query vs. abstract)
  - 20% citation weight (log-scaled citation count)
  - 10% recency (years since 2000)
- **AI Paper Appraisals**: Optional OpenAI GPT-4 Mini integration to generate relevance summaries for each paper
- **Rate Limit Handling**: Automatic retry logic with exponential backoff for Semantic Scholar API
- **Comprehensive Logging**: Track search progress, API calls, and errors
- **Responsive Frontend**: Clean, modern UI with sorting and modal appraisals

## Tech Stack

### Backend
- **Framework**: FastAPI 0.128.0
- **API Server**: Uvicorn 0.40.0
- **Data Validation**: Pydantic 2.12.5
- **Embeddings**: Sentence Transformers 5.2.0 (all-MiniLM-L6-v2)
- **Similarity**: scikit-learn 1.8.0 (cosine_similarity)
- **Paper Search**: Semantic Scholar API (via semanticscholar 0.11.0)
- **AI Integration**: OpenAI 2.14.0 (gpt-4o-mini)

### Frontend
- **HTML/CSS**: Custom stylesheet with Google Fonts (Newsreader, IBM Plex Mono)
- **JavaScript**: Vanilla JS with async/await for API communication
- **Features**: Paper sorting, appraisal modal, abstract expansion

## Getting Started

### Prerequisites
- Python 3.8+
- `pip` and `venv`
- OpenAI API key (optional, for paper summaries)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/source-finder.git
cd source-finder
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r backend/requirements.txt
```

4. Create `.env` file with your OpenAI API key:
```
OPENAI_API_KEY=sk-your-key-here
```

### Running Locally

**Terminal 1 - Start the backend:**
```bash
uvicorn backend.main:app --reload
```
Server runs at `http://localhost:8000`

**Terminal 2 - Serve the frontend:**
```bash
cd frontend
python -m http.server 8080
```
Open `http://localhost:8080/app.html` in your browser

## API Endpoints

### `POST /search`
Search for papers and get ranked results.

**Request:**
```json
{
  "query": "machine learning in healthcare",
  "limit": 10,
  "include_llm": true
}
```

**Response:**
```json
{
  "results": [
    {
      "Title": "...",
      "URL": "https://semanticscholar.org/...",
      "Abstract": "...",
      "Year": 2023,
      "CitationCount": 42,
      "RelevanceScore": 0.756
    }
  ],
  "llm_summary": "1. **Summary**: ... 2. **Summary**: ..."
}
```

**Parameters:**
- `query` (string, required): Search query
- `limit` (int, default=5): Number of papers to return (max 100)
- `include_llm` (bool, default=false): Generate AI appraisals

### `GET /health`
Health check endpoint. Returns `{"status": "ok"}`.

## How It Works

1. **Paper Retrieval**: Query sent to Semantic Scholar API with retry logic for rate limits
2. **Embedding**: Query and each paper's title+abstract encoded using SentenceTransformer
3. **Scoring**: Composite score computed (semantic similarity + citations + recency)
4. **Ranking**: Papers sorted by score descending
5. **LLM Appraisal** (optional): GPT-4 Mini generates structured paper summaries
6. **Frontend Display**: Results shown with sortable columns, abstracts, and modal appraisals

## Architecture

```
source-finder/
├── backend/
│   ├── main.py          # FastAPI app, routes, validation
│   ├── requirements.txt  # Python dependencies
│   └── __init__.py
├── app/
│   ├── services.py      # Paper search, ranking, LLM logic
│   └── __init__.py
├── frontend/
│   ├── app.html         # Main page structure
│   ├── fetch.js         # API client, DOM rendering
│   └── styles.css       # UI styling
└── README.md
```

## Limitations

- **Free API Rate Limits**: Semantic Scholar's free tier is shared across all unauthenticated users (~1000 req/sec globally). High traffic causes rate limiting.
- **Model Size**: SentenceTransformer and PyTorch dependencies are large (~2GB), making cloud deployment on free tiers difficult.
- **No Caching**: Repeated searches re-query the API each time.
- **No Database**: Results not persisted.
- **LLM Costs**: OpenAI API calls incur costs (~$0.005 per paper with gpt-4o-mini).

## Future Improvements

- [ ] Cache popular searches locally
- [ ] Implement user authentication and saved searches
- [ ] Add advanced filters (publication year range, venue, open access only)
- [ ] Deploy frontend to Vercel and backend to Railway/AWS Lambda
- [ ] Support for other LLMs (open-source models to reduce costs)
- [ ] Batch API requests for improved efficiency
- [ ] Add export (BibTeX, CSV) functionality

## Running Tests

Currently no automated tests. To manually test:

1. Start the backend (see "Running Locally")
2. Query without LLM: Test basic paper ranking
3. Query with LLM: Verify appraisals generate correctly
4. Test with high limit: Confirm rate limit handling works
5. Check console logs for any errors

## Error Handling

- **503 Service Unavailable**: Semantic Scholar API is rate-limited or down. Retry after a few minutes.
- **400 Bad Request**: OPENAI_API_KEY not set when `include_llm=true`.
- **500 Internal Server Error**: Unexpected error in ranking or LLM logic. Check server logs.

## Deployment Challenges

This project requires significant memory and disk space due to ML dependencies:
- PyTorch: ~1GB
- Transformers + SentenceTransformer: ~1GB
- Other dependencies: ~500MB

Most free hosting tiers (512MB RAM) cannot support this. Consider:
- Paid tier on Render (~$7/month for 2GB RAM)
- AWS Lambda with pre-built Docker image
- Local deployment or self-hosted server

## License

MIT

---

**Built by Liam Hooks** as a learning project exploring full-stack development, semantic search, and API integration.
