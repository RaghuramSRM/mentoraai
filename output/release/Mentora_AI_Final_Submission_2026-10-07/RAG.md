# Retrieval-Augmented Generation

The Tutor uses a persistent ChromaDB collection populated from Markdown files in `knowledge/`. `backend/scripts/ingest_knowledge.py` chunks documents, generates deterministic local hashed-token embeddings, and upserts content-hash IDs with source metadata. Re-running ingestion is idempotent.

At request time, the backend embeds the learner's question, retrieves the most relevant passages, passes that context to the selected agent, and returns source filenames with the answer. Retrieval failures are explicit service errors rather than silently invented grounding.

Run ingestion from `backend`:

```powershell
python scripts/ingest_knowledge.py
```

`RAG_DB_PATH` controls persistence. The default `.env.example` path is resolved from the project root. The deterministic embedding keeps offline mode reproducible; production should replace it with a high-quality evaluated embedding model and add a question/expected-source retrieval benchmark before launch.
