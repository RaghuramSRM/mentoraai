from app.rag import ingest

if __name__ == "__main__":
    count = ingest(force=True)
    print(f"Indexed {count} knowledge chunks")
