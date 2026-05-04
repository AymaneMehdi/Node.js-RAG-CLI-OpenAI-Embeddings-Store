# Node.js RAG CLI with OpenAI Embeddings Store

A lightweight **Retrieval-Augmented Generation (RAG)** system built with Node.js that stores embeddings in JSON for persistent, fast retrieval. This CLI application lets you ask questions about your documents, with answers powered by OpenAI's GPT-4 and semantic search.

## What is RAG?

**Retrieval-Augmented Generation (RAG)** enhances Large Language Models (LLMs) by:
1. **Retrieving** relevant information from your knowledge base first
2. **Using** that information as context
3. **Generating** accurate, grounded answers based on the context

This approach prevents hallucinations and ensures answers are based on your actual documents.

---

## How It Works: The RAG Pipeline

The system follows this workflow with persistent embedding storage:

### **Step 1: Load**
- Read your documents from `docs.txt`
- Load all text data into memory

### **Step 2: Split**
- Break the document into chunks by splitting on periods (`.`)
- Filter out empty chunks to keep meaningful content
- Example: `"Hello. World."` → `["Hello", "World"]`

### **Step 3: Embed**
- Convert each chunk into an embedding vector using OpenAI's `text-embedding-3-small` model
- Each embedding is a numerical representation of the chunk's semantic meaning

### **Step 4: Store**
- Save all chunks with their embeddings to `store.json`
- This is a **one-time operation** - embeddings are only generated once
- Subsequent runs reuse the saved embeddings instantly

### **Step 5: User Question**
- User asks a question via CLI prompt

### **Step 6: Embed Question**
- Convert the user's question into an embedding using the same model
- Question and stored chunks now exist in the same embedding space

### **Step 7: Search & Retrieve**
- Calculate **cosine similarity** between question embedding and all chunk embeddings
- Cosine similarity measures how similar two vectors are (0 = not similar, 1 = identical)
- Retrieve top 3 most relevant chunks as context

### **Step 8: Generate Answer**
- Send the retrieved context + question to GPT-4
- The system prompt ensures answers only use the provided context
- LLM generates an accurate, grounded response

### **Step 9: Return Answer**
- Display the answer to the user in the terminal

---

## Project Structure

```
Node.js-RAG-CLI-OpenAI/
├── RAG.js                # Main application - the entire RAG system
├── package.json          # Dependencies (openai, dotenv)
├── package-lock.json     # Locked dependency versions
├── README.md             # This file
├── docs.txt              # Your knowledge base (create this)
├── store.json            # Auto-generated embedding storage (created on first run)
├── .env                  # Environment variables (create this - never commit!)
└── LICENSE               # ISC License
```

**Key Files:**
- `docs.txt` - Your document/knowledge base (you create this)
- `store.json` - Auto-generated on first run, stores all embeddings + chunks
- `.env` - Stores your OpenAI API key (keep secret!)

---

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **OpenAI API Key** (get one at https://platform.openai.com/api-keys)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AymaneMehdi/Node.js-RAG-CLI-OpenAI-Embeddings-Store.git
   cd Node.js-RAG-CLI-OpenAI-Embeddings-Store
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   Replace `your_api_key_here` with your actual OpenAI API key

4. **Create a `docs.txt` file** with your knowledge base
   ```bash
   # Add your documents to docs.txt
   # Chunks will be split by periods (.)
   # Example:
   # "The Earth orbits the Sun. The Sun is a star. Stars are massive celestial bodies."
   ```

### Running the Application

**First Run** (creates embeddings and stores them in `store.json`):
```bash
node RAG.js
```

You'll see:
```
store.json not found. Building embeddings...
Embedded: chunk text here...
Embeddings saved in store.json
Ask a question:
```

**Subsequent Runs** (uses saved embeddings - instant!):
```bash
node RAG.js
```

You'll see:
```
store.json found. Using saved embeddings.
Ask a question:
```

### Example Usage

**docs.txt:**
```
The Solar System contains eight planets. 
Mercury is the closest to the Sun. 
Venus has a thick atmosphere. 
Earth is our home planet.
```

**Running the app:**
```bash
$ node RAG.js
store.json found. Using saved embeddings.
Ask a question: Which planet is closest to the Sun?

Answer:
Mercury is the closest planet to the Sun.
```

---

## How the Code Works

The RAG system is built in 9 steps:

| Step | Function | Purpose |
|------|----------|---------|
| **0** | Imports | Load OpenAI, fs, readline modules |
| **1** | Create Client | Initialize OpenAI API client with API key |
| **2** | File Paths | Define `docs.txt` and `store.json` locations |
| **3** | createEmbedding() | Convert text to embedding vector |
| **4** | cosineSimilarity() | Calculate similarity between two embeddings |
| **5** | buildStoreIfNeeded() | Generate embeddings once and save to JSON |
| **6** | loadStore() | Load embeddings from `store.json` |
| **7** | askQuestion() | Get user input from CLI |
| **8** | main() | Orchestrate the RAG pipeline |
| **9** | Run | Execute the main function |

### Key Data Structures

**store.json structure:**
```json
[
  {
    "text": "Mercury is the closest to the Sun.",
    "embedding": [0.0234, -0.0156, 0.0432, ...]
  },
  {
    "text": "Earth is our home planet.",
    "embedding": [-0.0123, 0.0456, -0.0789, ...]
  }
]
```

Each chunk has:
- `text` - The original text chunk
- `embedding` - A vector of 1536 numbers (for text-embedding-3-small)

---

## Configuration & Customization

### Adjustable Parameters in `RAG.js`

| Parameter | Location | Default | Purpose |
|-----------|----------|---------|---------|
| Chunk delimiter | Line ~78 | `.split(".")` | Split chunks by periods |
| Top results | Line ~155 | `.slice(0, 3)` | Retrieve top 3 chunks |
| Embedding model | Line ~34 | `text-embedding-3-small` | Model for embeddings |
| LLM model | Line ~157 | `gpt-4.1-mini` | Model for generating answers |
| System prompt | Line ~160 | "Answer ONLY using..." | Controls LLM behavior |

### Example: Retrieve Top 5 Results Instead of 3

Find this line (around line 155):
```javascript
.slice(0, 3);  // Get 3 results
```

Change to:
```javascript
.slice(0, 5);  // Get 5 results
```

Then delete `store.json` to regenerate embeddings with the new setting.

### Example: Use Different Embedding Model

Find this line (around line 34):
```javascript
model: "text-embedding-3-small",
```

Change to:
```javascript
model: "text-embedding-3-large",  // More accurate but more expensive
```

Then delete `store.json` and regenerate.

---

## Performance & Storage

### Embedding Storage Benefits

- **Fast repeated queries:** Embeddings are computed once and reused
- **Offline compatible:** After building `store.json`, you can query without regenerating embeddings each time
- **Persistent storage:** Embeddings survive application restarts
- **Portable:** Share `store.json` with others (it contains no sensitive data)

### First Run Performance

| Documents Size | Chunks | Build Time | API Cost |
|---|---|---|---|
| Small (< 5KB) | 10-20 | 5-10 sec | ~$0.01 |
| Medium (50KB) | 100-200 | 30-60 sec | ~$0.10 |
| Large (1MB) | 1000-2000 | 5-10 min | ~$1.00 |

*Note: API costs depend on OpenAI pricing and query complexity*

### Subsequent Runs

- **No embedding generation** - reads directly from `store.json`
- **Ultra-fast** - instant embedding lookup and similarity calculations
- **No API cost** - only pays for the LLM completion (generating the answer)

---

## Workflow Overview

```
First Time:
docs.txt → [Split] → [Embed with API] → store.json
                                            ↓
                                      (saved forever)

Every Run:
store.json → [Load] → [Similarity search] → [LLM completion] → Answer
         (instant)   (local computation)  (API call)         (user gets answer)
```

---

## Tips & Best Practices

1. **Document Quality**
   - Better documents = better answers
   - Keep `docs.txt` organized and relevant
   - Remove redundant information

2. **Chunk Size Matters**
   - Smaller chunks = more precise matching but may lose context
   - Larger chunks = more context but may match less precisely
   - Experiment with different split delimiters (`,` vs `.` vs `\n`)

3. **Adding New Documents**
   - Delete `store.json` to regenerate embeddings
   - Update `docs.txt` with new content
   - Next run will rebuild embeddings

4. **Cost Optimization**
   - Embeddings are expensive (first run only)
   - LLM completions are cheaper than embeddings
   - Consider batching questions to amortize costs

5. **System Prompt Tuning**
   - Change the system message to modify LLM behavior
   - Examples:
     - "Answer in one sentence" - concise answers
     - "Cite the source" - answer with references
     - "Explain like I'm 5" - simplified explanations

---

## Security

- **Never commit `.env` to Git** - Add to `.gitignore`:
  ```
  .env
  node_modules/
  ```
- **Keep your OpenAI API key private** - Never share your `.env` file
- **store.json is safe to share** - It contains only embeddings (vectors), no sensitive data
- **Never push credentials** - Use environment variables for all secrets

---

## Dependencies

| Package | Purpose |
|---------|---------|
| **openai** (v4.x) | Official OpenAI SDK for embeddings and chat completions |
| **dotenv** | Load environment variables from `.env` file |

### Install Dependencies
```bash
npm install
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `Error: ENOENT: no such file or directory, open 'docs.txt'` | `docs.txt` doesn't exist | Create a `docs.txt` file in the project root with your documents |
| `OPENAI_API_KEY is undefined` | `.env` file missing or incorrect | Create `.env` file with `OPENAI_API_KEY=your_key_here` |
| `ENOTFOUND: api.openai.com` | Network or API key issue | Check your internet connection and API key validity |
| `Error: Model not found` | Invalid model name | Verify model names: `text-embedding-3-small`, `gpt-4.1-mini` are correct |
| `store.json is corrupted` | File damage | Delete `store.json` and regenerate by running `node RAG.js` |
| `No relevant results` | Poor document/question matching | Try rewording your question or adding more relevant documents |
| `Embedding takes too long` | Large document size | Reduce document size or use more specific content |

### Manual Regeneration

If `store.json` becomes corrupted or you want to rebuild embeddings:
```bash
# Delete the store
rm store.json

# Regenerate by running the app
node RAG.js
```

---

## Real-World Example

### Scenario: FAQ Assistant

**docs.txt:**
```
What is Node.js. Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. Why use Node.js. Node.js allows you to use JavaScript on the server side. Is Node.js good for real-time applications. Yes, Node.js excels at real-time applications with WebSockets. Can Node.js handle CPU-intensive tasks. Node.js is single-threaded and not ideal for heavy CPU tasks.
```

**First Run:**
```bash
$ node RAG.js
store.json not found. Building embeddings...
Embedded: What is Node.js
Embedded: Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine
Embedded: Why use Node.js
...
Embeddings saved in store.json
Ask a question: Can I use Node.js for web servers?
```

**After processing:**
```
Answer:
Node.js allows you to use JavaScript on the server side, making it an excellent choice for web servers. It excels at handling multiple concurrent connections and is particularly well-suited for building scalable network applications.
```

---

## Advanced Modifications

### 1. Split by Different Delimiter

Change line ~78 from:
```javascript
.split(".")
```

To split by newlines:
```javascript
.split("\n")
```

Or by commas:
```javascript
.split(",")
```

Then delete `store.json` and regenerate.

### 2. Add Metadata to Chunks

Modify the store to include document source:
```javascript
store.push({
  text: chunk,
  embedding: embedding,
  source: "document_name.txt"
});
```

### 3. Filter Out Short Chunks

Find the filter line (~79) and add length check:
```javascript
.filter(chunk => chunk.trim().length > 10)  // Only keep chunks > 10 chars
```

### 4. Temperature & Randomness

Control LLM creativity by adding temperature parameter (~160):
```javascript
{
  model: "gpt-4.1-mini",
  temperature: 0.7,  // 0 = deterministic, 1 = creative
  messages: [...]
}
```

---

## API Cost Estimation

### Embedding Costs (First Run Only)
- **text-embedding-3-small:** $0.02 per 1M tokens
- **1000 chunks (avg 50 tokens each):** ~$0.001

### LLM Completion Costs (Every Query)
- **gpt-4.1-mini:** Much cheaper than GPT-4
- **Per query:** ~$0.01-0.05 depending on answer length

### Total Cost Example
- **Initial setup (1000 chunks):** ~$0.01
- **Per 100 questions:** ~$1-5
- **Monthly (1000 questions):** ~$10-50

### Cost Optimization
- Use `text-embedding-3-small` instead of large for better value
- Fewer, more relevant chunks reduce LLM token usage
- Reuse embeddings (no regeneration cost after first run)

---

## Learn More

- [OpenAI Embeddings Documentation](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI Chat Completions](https://platform.openai.com/docs/guides/gpt)
- [Cosine Similarity Explained](https://en.wikipedia.org/wiki/Cosine_similarity)
- [RAG Concept](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)
- [Vector Databases](https://www.pinecone.io/learn/vector-database/)

---

## License

This project is licensed under the [MIT License](LICENSE).
---
Copyright© Aymane Mehdi