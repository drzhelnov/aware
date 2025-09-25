import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

interface VerificationRequest {
  ris_file_hash: string;
  relevant_hashes: string[];
}

interface MapFile {
  relevant: string[];
  irrelevant: string[];
}

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request
    const body: VerificationRequest = await request.json();
    
    if (!body.ris_file_hash || !body.relevant_hashes) {
      return new Response(
        JSON.stringify({ error: 'Missing ris_file_hash or relevant_hashes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load map file based on RIS hash
    const mapPath = join(process.cwd(), 'dev', 'maps', `${body.ris_file_hash}.json`);
    
    let mapData: MapFile;
    try {
      const mapContent = readFileSync(mapPath, 'utf-8');
      mapData = JSON.parse(mapContent);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Map file not found for this RIS file' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate ground truth data
    if (!mapData.relevant || !mapData.irrelevant) {
      return new Response(
        JSON.stringify({ error: 'Invalid map file format' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert arrays to sets for efficient lookup
    const relevantSet = new Set(mapData.relevant);
    const irrelevantSet = new Set(mapData.irrelevant);
    const submittedSet = new Set(body.relevant_hashes);

    // Check if all relevant hashes are included
    for (const hash of mapData.relevant) {
      if (!submittedSet.has(hash)) {
        return new Response(
          JSON.stringify({ result: 'FAIL' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if any irrelevant hashes are included
    for (const hash of body.relevant_hashes) {
      if (irrelevantSet.has(hash)) {
        return new Response(
          JSON.stringify({ result: 'FAIL' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // All checks passed
    return new Response(
      JSON.stringify({ result: 'PASS' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
