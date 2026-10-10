import hashlib
import math
import os
import re
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).resolve().parents[2] / "knowledge"
RAG_DB_PATH = os.getenv("RAG_DB_PATH", str(Path(__file__).resolve().parents[1] / "chroma"))


def chunks(text, size=700, overlap=100):
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    result, current = [], ""
    for paragraph in paragraphs:
        if current and len(current) + len(paragraph) + 2 > size:
            result.append(current)
            current = paragraph
        else:
            current = f"{current}\n\n{paragraph}".strip()
    if current: result.append(current)
    return result


ALIASES = {
    "ai": "artificial intelligence",
    "api": "application programming interface",
    "apis": "application programming interface",
    "css": "cascading style sheets",
    "dsa": "data structures algorithms",
    "html": "hypertext markup language",
    "llm": "large language model",
    "llms": "large language model",
    "ml": "machine learning",
    "rag": "retrieval augmented generation",
}


def normalized_tokens(text):
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    expanded = []
    for token in tokens:
        normalized = token
        if len(token) > 4 and token.endswith("ies"):
            normalized = token[:-3] + "y"
        elif len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
            normalized = token[:-1]
        expanded.append(normalized)
        expanded.extend(ALIASES.get(token, "").split())
    return expanded


def embed(text, dimensions=256):
    vector = [0.0] * dimensions
    for token in normalized_tokens(text):
        digest = hashlib.sha256(token.encode()).digest()
        index = int.from_bytes(digest[:4], "little") % dimensions
        vector[index] += -1.0 if digest[4] & 1 else 1.0
    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / norm for value in vector]


def _collection():
    import chromadb
    client = chromadb.PersistentClient(path=RAG_DB_PATH)
    return client.get_or_create_collection("mentora_knowledge", metadata={"hnsw:space":"cosine"})


def ingest(force=False):
    collection = _collection()
    if force:
        existing = collection.get()
        if existing["ids"]: collection.delete(ids=existing["ids"])
    elif collection.count() > 0:
        return collection.count()
    ids, documents, metadatas, embeddings = [], [], [], []
    for path in sorted(KNOWLEDGE_DIR.rglob("*.md")):
        for index, text in enumerate(chunks(path.read_text(encoding="utf-8"))):
            ids.append(hashlib.sha256(f"{path}:{index}:{text}".encode()).hexdigest()[:24])
            source = path.relative_to(KNOWLEDGE_DIR).as_posix()
            documents.append(text); metadatas.append({"source":source,"topic":path.parent.name}); embeddings.append(embed(text))
    if documents: collection.add(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
    return len(documents)


def retrieve(query, limit=3):
    try:
        collection = _collection()
        if collection.count() == 0: ingest()
        candidate_count = min(max(limit * 8, 24), max(collection.count(), 1))
        result = collection.query(
            query_embeddings=[embed(query)],
            n_results=candidate_count,
            include=["documents", "metadatas"],
        )
        ignored = {"a", "an", "and", "define", "detail", "detailed", "explain", "for", "how", "in", "is", "of", "simple", "simply", "term", "the", "to", "what"}
        content_tokens = [token for token in normalized_tokens(query) if token not in ignored]
        query_terms = set(content_tokens)
        concept_phrase = " ".join(content_tokens[:3])
        definition_request = any(word in query.lower().split() for word in ["define", "explain", "what"])
        ranked = []
        query_vector = embed(query)
        documents = (result.get("documents") or [[]])[0]
        metadatas = (result.get("metadatas") or [[]])[0]
        for text, meta in zip(documents, metadatas):
            document_terms = set(normalized_tokens(text))
            overlap = len(query_terms & document_terms)
            text_lower = text.lower()
            phrase_bonus = 2 if query.lower().strip() in text_lower else 0
            definition_patterns = (" is", " means", " refers to", " verifies", " describes")
            definition_bonus = 3 if definition_request and concept_phrase and any(f"{concept_phrase}{ending}" in text_lower for ending in definition_patterns) else 0
            document_vector = embed(text)
            distance = 1 - sum(a * b for a, b in zip(query_vector, document_vector))
            ranked.append((overlap + phrase_bonus + definition_bonus, distance, text, meta))
        ranked.sort(key=lambda item: (-item[0], item[1]))
        return [
            {"text": text, "source": meta["source"], "topic": meta["topic"]}
            for _, _, text, meta in ranked[:limit]
        ]
    except Exception as exc:
        raise RuntimeError(f"Knowledge retrieval failed: {exc}") from exc
