#!/usr/bin/env bun

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

interface RISRecord {
  hash: string;
  content: string;
}

function parseRISContent(content: string): RISRecord[] {
  const records: RISRecord[] = [];
  
  // Split by record boundaries (TY - starts, ER - ends)
  const lines = content.split('\n');
  let currentRecord: string[] = [];
  let inRecord = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('TY  -')) {
      if (inRecord && currentRecord.length > 0) {
        records.push(createRecord(currentRecord.join('\n')));
      }
      currentRecord = [line];
      inRecord = true;
    } else if (trimmed.startsWith('ER  -')) {
      if (inRecord) {
        currentRecord.push(line);
        records.push(createRecord(currentRecord.join('\n')));
        currentRecord = [];
        inRecord = false;
      }
    } else if (inRecord) {
      currentRecord.push(line);
    }
  }
  
  // Handle last record if no ER
  if (inRecord && currentRecord.length > 0) {
    records.push(createRecord(currentRecord.join('\n')));
  }
  
  return records;
}

function createRecord(content: string): RISRecord {
  // Normalize content for consistent hashing
  const normalized = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
    
  const hash = createHash('sha256').update(normalized).digest('hex');
  
  return { hash, content };
}

function createHashMap(records: RISRecord[]): Map<string, RISRecord> {
  const map = new Map<string, RISRecord>();
  for (const record of records) {
    map.set(record.hash, record);
  }
  return map;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.error('Usage: bun generate-map.ts <full_ris_file> <relevant.ris> <irrelevant.ris>');
    console.error('');
    console.error('Example:');
    console.error('  bun generate-map.ts dataset.ris ground-truth/relevant.ris ground-truth/irrelevant.ris');
    process.exit(1);
  }
  
  const [fullRisPath, relevantRisPath, irrelevantRisPath] = args;
  
  try {
    console.log('📖 Reading RIS files...');
    
    // Read and parse all files
    const fullContent = readFileSync(fullRisPath, 'utf-8');
    const relevantContent = readFileSync(relevantRisPath, 'utf-8');
    const irrelevantContent = readFileSync(irrelevantRisPath, 'utf-8');
    
    console.log('🔍 Parsing records...');
    
    const fullRecords = parseRISContent(fullContent);
    const relevantRecords = parseRISContent(relevantContent);
    const irrelevantRecords = parseRISContent(irrelevantContent);
    
    console.log(`   Full dataset: ${fullRecords.length} records`);
    console.log(`   Relevant: ${relevantRecords.length} records`);
    console.log(`   Irrelevant: ${irrelevantRecords.length} records`);
    
    // Create hash map of full dataset
    const fullHashMap = createHashMap(fullRecords);
    
    // Validate that relevant/irrelevant are subsets of full
    const relevantHashes: string[] = [];
    const irrelevantHashes: string[] = [];
    
    console.log('✅ Validating subsets...');
    
    for (const record of relevantRecords) {
      if (fullHashMap.has(record.hash)) {
        relevantHashes.push(record.hash);
      } else {
        console.error(`❌ Relevant record not found in full dataset: ${record.hash.substring(0, 8)}...`);
        process.exit(1);
      }
    }
    
    for (const record of irrelevantRecords) {
      if (fullHashMap.has(record.hash)) {
        irrelevantHashes.push(record.hash);
      } else {
        console.error(`❌ Irrelevant record not found in full dataset: ${record.hash.substring(0, 8)}...`);
        process.exit(1);
      }
    }
    
    // Check for overlaps
    const relevantSet = new Set(relevantHashes);
    const irrelevantSet = new Set(irrelevantHashes);
    
    for (const hash of relevantHashes) {
      if (irrelevantSet.has(hash)) {
        console.error(`❌ Record appears in both relevant and irrelevant: ${hash.substring(0, 8)}...`);
        process.exit(1);
      }
    }
    
    // Generate hash for full RIS file
    const fullRisHash = createHash('sha256').update(fullContent).digest('hex');
    
    console.log('🎯 Creating map file...');
    
    // Create map object
    const mapData = {
      relevant: relevantHashes,
      irrelevant: irrelevantHashes,
      metadata: {
        full_ris_hash: fullRisHash,
        full_records: fullRecords.length,
        relevant_count: relevantHashes.length,
        irrelevant_count: irrelevantHashes.length,
        created_at: new Date().toISOString(),
        source_files: {
          full: fullRisPath,
          relevant: relevantRisPath,
          irrelevant: irrelevantRisPath
        }
      }
    };
    
    // Ensure maps directory exists
    const mapsDir = join(process.cwd(), 'dev', 'maps');
    mkdirSync(mapsDir, { recursive: true });
    
    // Write map file
    const mapPath = join(mapsDir, `${fullRisHash}.json`);
    writeFileSync(mapPath, JSON.stringify(mapData, null, 2));
    
    console.log('✅ Map file created successfully!');
    console.log('');
    console.log(`📋 Summary:`);
    console.log(`   RIS File Hash: ${fullRisHash}`);
    console.log(`   Map File: ${mapPath}`);
    console.log(`   Relevant Records: ${relevantHashes.length}`);
    console.log(`   Irrelevant Records: ${irrelevantHashes.length}`);
    console.log(`   Total Ground Truth: ${relevantHashes.length + irrelevantHashes.length}`);
    console.log('');
    console.log('🚀 Your verification endpoint can now handle requests with:');
    console.log(`   ris_file_hash: "${fullRisHash}"`);
    console.log('');
    console.log('Relevant hashes:');
    console.log(JSON.stringify(relevantHashes));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
