#!/bin/bash
# Merge master RIS and re-dump ground truth reliably for record hashes
HASH=$(python dev/merge_ris_rnd.py dev/example/true_irrelevant_rnd_sample_n-5.ris dev/example/true_relevant_rnd_sample_n-5.ris)

# Generate map
RELEVANT=$(bun dev/generate-map.ts "dev/$HASH/merged_10.ris" "dev/$HASH/true_relevant_rnd_sample_n-5.ris.dumped.ris" "dev/$HASH/true_irrelevant_rnd_sample_n-5.ris.dumped.ris" | tail -n1)

# Test with curl
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{
    "ris_file_hash": "'$HASH'",
    "relevant_hashes": '$RELEVANT'
  }'
