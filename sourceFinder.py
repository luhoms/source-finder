from semanticscholar import SemanticScholar
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import math
from openai import OpenAI
import requests
import time


sch = SemanticScholar()
model = SentenceTransformer("all-MiniLM-L6-v2")

client = OpenAI()

def search_papers(query: str, limit: int, retries: int = 3):
    """
    Fetch papers from Semantic Scholar.
    Returns a list of Paper objects (library returns objects, not dicts).
    """
    url = "https://api.semanticscholar.org/graph/v1/paper/search"
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,abstract,url,year,citationCount,influentialCitationCount,venue,publicationTypes,isOpenAccess,openAccessPdf"
    }

    for attempt in range(retries):
        response = requests.get(url, params=params, timeout=30)

        if response.status_code == 200:
            return response.json().get("data", [])
        
        if response.status_code == 429:
            wait_time = 2 ** attempt
            print(f"Rate limited by Semantic Scholar. Retrying in {wait_time}s")
            time.sleep(wait_time)
            continue

        response.raise_for_status()

    raise RuntimeError("Semantic Scholar API rate limit exceeded after retries.")


def compute_relevance_score(query_emb, paper) -> float:
    """
    Compute a composite relevance score for a single paper.
    Score = 0.7 * semantic_similarity + 0.2 * citation_boost + 0.1 * year_boost
    """
    title = paper.get("title") or ""
    abstract = paper.get("abstract") or ""
    year = paper.get("year")
    citation_count = paper.get("citationCount") or 0


    paper_text = f"Title: {title}. Abstract: {abstract}"
    paper_emb = model.encode(paper_text, normalize_embeddings=True)

    # Semantic similarity (0..1-ish)
    similarity = cosine_similarity([query_emb], [paper_emb])[0][0]

    # Metadata boosts (kept small so they don't dominate)
    citation_boost = math.log1p(citation_count) / 10
    year_boost = (year - 2000) / 25 if isinstance(year, int) else 0

    final_score = (
        0.7 * similarity +
        0.2 * citation_boost +
        0.1 * year_boost
    )
    return float(final_score)


def rank_papers(query: str, limit: int):
    print("Fetching papers...")
    papers = search_papers(query, limit)

    print("Encoding query...")
    query_emb = model.encode(query, normalize_embeddings=True)

    ranked = []
    for paper in papers:
        title = paper.get("title") or ""
        print(f"Scoring: {title[:80]}")

        score = compute_relevance_score(query_emb, paper)

        ranked.append({
            "Title": title,
            "URL": paper.get("url"),
            "Abstract": paper.get("abstract") or "",
            "Year": paper.get("year"),
            "CitationCount": paper.get("citationCount") or 0,
            "RelevanceScore": score
        })

    ranked.sort(key=lambda x: x["RelevanceScore"], reverse=True)
    return ranked


def summarize_papers_with_llm(query, ranked_papers):
    """
    Uses OpenAI to generate human-readable explanations
    for ranked academic sources.
    """

    system_prompt = """
    You are an academic research assistant helping users evaluate the relevance of academic papers to their research query.

    You will receive:
    - A user's research query
    - A ranked list of academic papers (each with title, abstract, URL, and relevance score)

    For each paper, provide:
    1. **Summary** (2-3 sentences): What the paper studies and its main findings/approach
    2. **Relevance** (1-2 sentences): How it specifically relates to the user's query
    3. **Recommendation** (1 sentence): Rate as "Highly Relevant", "Moderately Relevant", or "Tangentially Relevant" with brief justification

    Format your response as a numbered list, one entry per paper, in the order provided.

    Guidelines:
    - Base all statements strictly on the provided abstract - do not infer or hallucinate details
    - Use clear, accessible language (avoid excessive jargon)
    - If an abstract is missing or too vague, note this limitation
    - Keep each paper evaluation to 4-6 sentences total
    - Focus on helping the user quickly decide if they should read the full paper
    """

    user_prompt = f"""
    User query:
    "{query}"

    Papers:
    {json.dumps(ranked_papers, indent=2)}
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content


if __name__ == "__main__":
    query = "impact of social media on youth"
    limit = 3

    
    results = rank_papers(query, limit)
    print(results)
    llm_summary = summarize_papers_with_llm(query, results)

    print("\n=== LLM ANALYSIS ===\n")
    print(llm_summary)
