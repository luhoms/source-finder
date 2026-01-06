from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from sourceFinder import *

app = FastAPI()

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
    try:
        ranked = rank_papers(req.query, req.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    llm_summary = None
    if req.include_llm:
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(status_code=400, detail="OPENAI_API_KEY not set")
        llm_summary = summarize_papers_with_llm(req.query, ranked)

    return {"results": ranked, "llm summary": llm_summary}



    