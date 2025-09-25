# Classification Verification Service

Ultra-lean verification service for AI agent classification tasks using Bun + Netlify.

## Setup

### 1. Generate Map File

```bash
# Make sure you have your RIS files ready 
bun generate-map.ts dataset.ris ground-truth/relevant.ris ground-truth/irrelevant.ris
```

This creates a map file in `maps/{ris_hash}.json` containing:
```json
{
  "relevant": ["hash1", "hash2", ...],
  "irrelevant": ["hash3", "hash4", ...],
  "metadata": { ... }
}
```

### 2. Deploy to Netlify

```bash
netlify deploy --prod
```

## Usage

### Agent Workflow

1. **Generate RIS file hash**:
```typescript
import { createHash } from 'crypto';

const risContent = await Bun.file('dataset.ris').text();
const risHash = createHash('sha256').update(risContent).digest('hex');
```

2. **Make classification decisions and get hashes**:
```typescript
// Parse RIS and classify each record
const relevantHashes: string[] = [];

// For each record you classify as relevant:
const recordHash = createHash('sha256').update(normalizedRecord).digest('hex');
relevantHashes.push(recordHash);
```

3. **Verify against ground truth**:
```typescript
const response = await fetch('https://your-site.netlify.app/.netlify/functions/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ris_file_hash: risHash,
    relevant_hashes: relevantHashes
  })
});

const result = await response.json();
console.log(result); // { "result": "PASS" } or { "result": "FAIL" }
```

## API

**Endpoint**: `POST /.netlify/functions/verify`

**Request**:
```json
{
  "ris_file_hash": "abc123...",
  "relevant_hashes": ["hash1", "hash2", ...]
}
```

**Response**:
```json
{ "result": "PASS" }
// or
{ "result": "FAIL" }
```

**Failure Conditions**:
- Missing any record that should be classified as relevant
- Including any record that should be classified as irrelevant
- Map file not found for the RIS hash
- Invalid request format

## File Structure

```
├── netlify/functions/verify.ts    # Verification endpoint
├── generate-map.ts               # CLI tool to create map files
├── maps/                        # Generated map files
│   └── {ris_hash}.json         # Map file for each RIS dataset
└── ground-truth/               # Your ground truth files
    ├── relevant.ris
    └── irrelevant.ris
```

## Example Classification Logic (for Agent)

```typescript
function normalizeRecord(content: string): string {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

function hashRecord(content: string): string {
  const normalized = normalizeRecord(content);
  return createHash('sha256').update(normalized).digest('hex');
}

// Agent implements this
function classifyRecord(record: string): 'relevant' | 'irrelevant' {
  // Your classification logic here
  // Return 'relevant' or 'irrelevant'
}
```

## Testing

```bash
# Test with curl
curl -X POST https://your-site.netlify.app/.netlify/functions/verify \
  -H "Content-Type: application/json" \
  -d '{
    "ris_file_hash": "your_ris_hash",
    "relevant_hashes": ["hash1", "hash2"]
  }'
```

Perfect for TDD-style iteration where the agent can test its classification logic repeatedly!
