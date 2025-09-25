#!/usr/bin/env python3
import sys, random, rispy, hashlib, os, tempfile

def main():
    random.seed(42)
    records = []
    for f in sys.argv[1:]:
        with open(f) as h:
            recs = rispy.load(h)
            records += recs

    random.shuffle(records)

    def inject_hashes(records):
        """add hash directly to the RIS record"""
        for r in records:
            # 'M1': 'note' (from rispy import TAG_KEY_MAPPING)
            r["note"] = hashlib.sha256(str(r).encode("utf-8")).hexdigest()
        return records
    
    records = inject_hashes(records)

    # create a canonical dump of merged records for hashing
    with tempfile.NamedTemporaryFile("w+", delete=False) as tmp:
        rispy.dump(records, tmp)
        tmp.flush()
        tmp.seek(0)
        data = tmp.read().encode("utf-8")
    sha = hashlib.sha256(data).hexdigest()
    outdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), sha)
    os.makedirs(outdir, exist_ok=True)

    merged_path = os.path.join(outdir, f"merged_{len(records)}.ris")
    with open(merged_path, "w") as o:
        o.write(data.decode("utf-8"))

    # also dump normalized records from each input file
    for f in sys.argv[1:]:
        with open(f) as h:
            recs = rispy.load(h)
            recs = inject_hashes(recs)
        base = os.path.basename(f)
        dump_path = os.path.join(outdir, base + ".dumped.ris")
        with open(dump_path, "w") as o:
            rispy.dump(recs, o)

    print(sha)

if __name__ == "__main__":
    main()
