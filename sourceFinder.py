from semanticscholar import SemanticScholar
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import math

sch = SemanticScholar()
model = SentenceTransformer("all-MiniLM-L6-v2")


def search_papers(query: str, limit: int):
    """
    Fetch papers from Semantic Scholar.
    Returns a list of Paper objects (library returns objects, not dicts).
    """
    results = sch.search_paper(query, limit=limit)

    # IMPORTANT: iterate over the internal list to avoid pagination iterator issues
    return results._data


def compute_relevance_score(query_emb, paper) -> float:
    """
    Compute a composite relevance score for a single paper.
    Score = 0.7 * semantic_similarity + 0.2 * citation_boost + 0.1 * year_boost
    """
    title = getattr(paper, "title", "") or ""
    abstract = getattr(paper, "abstract", None) or ""
    year = getattr(paper, "year", None)
    citation_count = getattr(paper, "citationCount", 0) or 0

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
        title = getattr(paper, "title", "") or ""
        print(f"Scoring: {title[:80]}")

        score = compute_relevance_score(query_emb, paper)

        ranked.append({
            "Title": title,
            "URL": getattr(paper, "url", None),
            "Abstract": getattr(paper, "abstract", None),
            "Year": getattr(paper, "year", None),
            "CitationCount": getattr(paper, "citationCount", None),
            "RelevanceScore": score
        })

    ranked.sort(key=lambda x: x["RelevanceScore"], reverse=True)
    return ranked


if __name__ == "__main__":
    query = "impact of social media on youth"
    limit = 5

    results = rank_papers(query, limit)
    print("\n=== Ranked Results (JSON) ===\n")
    print(json.dumps(results, indent=2))
