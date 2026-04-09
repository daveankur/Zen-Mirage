# 🧘‍♂️ Zen-Mirage 💸

> Because your automation workflows shouldn't have a bigger budget than your morning coffee. Stop burning real dollars on live API calls just to see if a webhook works. Test like a pro, spend like a monk. 

## 🤕 The Pain
You're trying to build a beautiful, complex automation workflow in n8n. To test it properly, you need real data payloads. So you configure your HTTP nodes to hit expensive APIs like Apollo, Serper.dev, or data enrichment tools. 

- Every time you press "Execute Workflow", you burn live credits. 
- Every time you demo it to a client, you risk exposing real, highly sensitive PII (Personally Identifiable Information).
- Before you know it, testing a single automation has cost you $20 and a minor privacy heart attack.

## 💡 The Idea
What if you had a blazing-fast, free, and local "mirage" of these APIs? A server that looks and acts exactly like Apollo or Serper, but returns randomly generated, ultra-realistic fake data every single time you ping it?

## 🛠️ The Solution
**Zen-Mirage** is an incredibly lightweight, dynamically generated Mock API framework. 

Instead of manually coding hundreds of Express routes, you simply drop a sample JSON payload from any provider into the `input-data/` folder, specify the path, and run:

```bash
npm run generate
```

Zen-Mirage uses intelligent heuristics to instantly ingest your real JSON, replace all the static values with dynamic `faker.js` commands (while leaving structural constraints intact), and automatically spin up an endpoint perfectly matching the provider's native route structure.

When n8n hits your live URL, it receives a completely different, perfectly structured, mathematically infinite data payload. Every. Single. Time.

Plus, it comes fully loaded with a built-in `npm run audit` pipeline to ensure you never accidentally push real leaked phone numbers or emails into your public templates.

## 🚀 Getting Started

### 1. Install & Run Locally
```bash
npm install
npm run dev
```

### 2. Add a new Mock API
1. Create a `.json` file in `input-data/` with the exact JSON response you want to mock.
2. Run `npm run generate` to dynamically map it to `faker`.
3. Your endpoint auto-registers and is instantly live.

Testing has never been this zen.
