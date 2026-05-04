// ==========================
// STEP 0: IMPORTS
// ==========================

import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import readline from "readline";


// ==========================
// STEP 1: CREATE OPENAI CLIENT
// ==========================

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// ==========================
// STEP 2: FILE PATHS
// ==========================

const DOCS_FILE = "docs.txt";
const STORE_FILE = "store.json";


// ==========================
// STEP 3: CREATE EMBEDDING FUNCTION
// ==========================

// This function converts any text string into an embedding vector
async function createEmbedding(text) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}


// ==========================
// STEP 4: COSINE SIMILARITY FUNCTION
// ==========================

// This function compares two embeddings and returns similarity score
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}


// ==========================
// STEP 5: BUILD STORE IF NOT EXISTS
// ==========================

// This function creates store.json only one time
async function buildStoreIfNeeded() {
  // If store.json already exists, we do not create embeddings again
  if (fs.existsSync(STORE_FILE)) {
    console.log("✅ store.json found. Using saved embeddings.");
    return;
  }

  console.log("⚙️ store.json not found. Building embeddings...");

  // Read docs.txt
  const documentText = fs.readFileSync(DOCS_FILE, "utf-8");

  // Split document into chunks
  const chunks = documentText
    .split(".")
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  // This array will contain text + embedding
  const store = [];

  // Convert every chunk into embedding
  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk);

    store.push({
      text: chunk,
      embedding: embedding,
    });

    console.log("Embedded:", chunk);
  }

  // Save embeddings in store.json
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));

  console.log("✅ Embeddings saved in store.json");
}


// ==========================
// STEP 6: LOAD STORE
// ==========================

function loadStore() {
  const storeText = fs.readFileSync(STORE_FILE, "utf-8");
  return JSON.parse(storeText);
}


// ==========================
// STEP 7: ASK QUESTION FROM CLI
// ==========================

function askQuestion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Ask a question: ", (question) => {
      rl.close();
      resolve(question);
    });
  });
}


// ==========================
// STEP 8: MAIN RAG FUNCTION
// ==========================

async function main() {
  // Build store.json if it does not exist
  await buildStoreIfNeeded();

  // Load saved embeddings from store.json
  const store = loadStore();

  // Get user question from terminal
  const question = await askQuestion();

  // Convert user question into embedding
  const questionEmbedding = await createEmbedding(question);

  // Compare question embedding with saved chunk embeddings
  const results = store
    .map((item) => ({
      text: item.text,
      score: cosineSimilarity(questionEmbedding, item.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Build context from best chunks
  const context = results.map((result) => result.text).join("\n");

  // Send question + context to LLM
  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Answer ONLY using the provided context. If the answer is not in the context, say you don't know.",
      },
      {
        role: "user",
        content: `
Context:
${context}

Question:
${question}
        `,
      },
    ],
  });

  // Print final answer
  console.log("\nAnswer:");
  console.log(completion.choices[0].message.content);
}


// ==========================
// STEP 9: RUN APP
// ==========================

main();