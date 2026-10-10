# Mentora Agents

The orchestrator uses clear intent rules and displays the chosen specialist in the UI.

- **Tutor:** explains concepts at learner level and uses retrieved knowledge.
- **Quiz Master:** generates checks, scores answers and identifies weak topics.
- **Career Coach:** compares current skills with the target role and orders next steps.
- **Project Guide:** recommends practical work matching skills and difficulty.
- **Researcher:** converts curated AI developments into short learning updates.
- **Reminder:** helps turn learning intent into an in-app follow-up.

The agent layer supports two provider modes. `demo` is deterministic and offline. `openai` calls the Responses API using the configured model and learner context, with timeout, rate-limit, network and empty-response handling. Tutor responses retrieve ChromaDB context and expose source filenames. The reminder capability is user-owned and in-app; it does not send external messages in the MVP.
