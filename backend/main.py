from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
from app.services import rank_papers, summarize_papers_with_llm

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)    

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "null"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    include_llm: bool = False

class PaperResult(BaseModel):
    Title: str
    URL: Optional[str]
    Abstract: Optional[str]
    Year: Optional[int]
    CitationCount: Optional[int]
    RelevanceScore: float

class SearchResponse(BaseModel):
    results: List[PaperResult]
    llm_summary: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/search", response_model=SearchResponse)
def search(req: SearchRequest):

    logging.info(f"Search request received - Query: '{req.query}', Limit: {req.limit}")
    try:
        ranked = rank_papers(req.query, req.limit)
        logging.info("Papers ranked")
    except Exception as e:
        logging.error(f"Ranking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    llm_summary = None
    if req.include_llm:
        if not os.getenv("OPENAI_API_KEY"):
            logging.error("OpenAI api key not set")
            raise HTTPException(status_code=400, detail="OPENAI_API_KEY not set")
        llm_summary = summarize_papers_with_llm(req.query, ranked)
        logging.info("LLM summarization completed")

    logging.info(f"Search completed successfully, returning {len(ranked)} results")
    return {"results": ranked, "llm_summary": llm_summary}



    