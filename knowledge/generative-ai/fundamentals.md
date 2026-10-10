# Generative AI and RAG

Embeddings represent semantic content as numerical vectors. Retrieval-augmented generation searches a trusted corpus for relevant passages, then supplies those passages to a language model as context.

A grounded answer should be supported by retrieved sources. Evaluation should measure retrieval relevance, answer correctness, groundedness and whether citations actually support the claims.

A large language model predicts tokens from context. A prompt provides instructions and input, while system-level instructions define application behavior. Temperature influences sampling variability but does not make unsupported facts reliable.

Tokenization converts text into model units. Context windows limit how much input a model can consider at once. Embeddings support semantic search by placing related content near each other in vector space.

RAG pipelines load source content, split it into useful chunks, create embeddings, retrieve relevant passages and generate an answer from that context. Good systems also handle weak retrieval, show sources and evaluate whether claims are supported.

AI applications need safeguards for privacy, prompt injection, harmful output and excessive permissions. Human review remains important for high-impact decisions and for evaluating errors that automated metrics miss.
