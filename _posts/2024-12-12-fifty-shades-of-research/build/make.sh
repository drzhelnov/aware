#!/bin/bash
merge_bib=false
rmd=".Rmd"
final="../../2024-12-12-fifty-shades-of-research.md"
#title="# RoRI_2025_grant_proposal"

#researchnet="../researchnet.md"
#summary_of_proposal="../summary_of_proposal.md"
#summary_of_progress="../summary_of_progress.md"
#budget="../budget.md"

#prepend="../source/prepend.docx"
head="head.yml"
front="../source/front.yml"
#abstract="../abstract.md"
#background="../background.md"
#methods="../methods.md"
#results="../results.md"
#discussion="../discussion.md"
body="../source/body.md"
refs="../source/refs/refs.md"
#append="../source/append.docx"

prepend_exists=false
if [ -f "$prepend" ]; then
    prepend_exists=true
fi

append_exists=false
if [ -f "$append" ]; then
    append_exists=true
fi

if [ "$prepend_exists" = true ] || [ "$append_exists" = true ]; then
    python3 -m pip install --user python-docx >/dev/null 2>&1 || {
        echo "Failed to install python-docx. Please check your Python installation."
        exit 1
    }
fi

set -e
{
  cat "$head"; echo ""
  #echo "$title"; echo ""
  if [ "$prepend_exists" = true ]; then
    echo "\newpage"; echo ""
  fi
  #cat "$front"; echo ""
  #cat "$researchnet"; echo ""
  #cat "$summary_of_proposal"; echo ""
  #echo "\newpage"; echo ""
  #cat "$proposal"; echo ""
  #tail -n +6 "$post"; echo "" # this hardcodes dropping frontmatter
  #echo "\newpage"; echo ""
  #cat "$budget"; echo ""
  #echo "\newpage"; echo ""
  cat "$body"; echo ""
  #cat "$abstract"; echo ""
  #cat "$background"; echo ""
  #cat "$methods"; echo ""
  #cat "$results"; echo ""
  #cat "$discussion"; echo ""
  #echo "\newpage"; echo ""
  cat "$refs"
  if [ "$append_exists" = true ]; then
    echo "\newpage"; echo ""
  fi
} > "$rmd"

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -b|--bibmerge)
            merge_bib=true
            shift # past argument
            ;;
        *)    # unknown option
            shift # past argument
            ;;
    esac
done

if [ "$merge_bib" = true ]; then
    python bibmerge.py
fi

# Uncomment if want full command output shown in shell for debug
#final=$(R -e "rmarkdown::render('"$rmd"')" 2>&1 | tee /dev/tty | grep "Output created:" | awk '{print $3}')
#final=$(R -e "rmarkdown::render('"$rmd"')" 2>&1 | grep "Output created:" | awk '{print $3}')
render=$(R -e "rmarkdown::render('"$rmd"')" 2>&1 | grep "Output created:" | awk '{print $3}')

set -e
{
  cat "$front"; echo ""
  cat "$render"; echo ""
} > "$final"

echo "Final filename: '$final'"
rm "$render"

# Neither prepend nor append file exists. Exiting.
if [ "$prepend_exists" = false ] && [ "$append_exists" = false ]; then
    exit 0
fi

# Neither prepend nor append file exists. Exiting.
if [[ "$prepend_exists" = *.docx ]] && [ "$append_exists" = false ]; then
    exit 0
fi

echo -n "Merging prepend/append..."
render="render.${final##*.}"
cp "$final" "$render"

python3 <<EOF
from docx import Document

# Load the base document
base_doc = Document("$render")

# Check if prepend and append documents exist and are not empty
if "$prepend_exists" == "true" and Document("$prepend").element.body.xml.strip():
    prepend_doc = Document("$prepend")
    # Prepend content to base document
    for element in reversed(prepend_doc.element.body):
        base_doc.element.body.insert(0, element)

if "$append_exists" == "true" and Document("$append").element.body.xml.strip():
    append_doc = Document("$append")
    # Append content to base document
    for element in append_doc.element.body:
        base_doc.element.body.append(element)

# Save the merged document
base_doc.save("$final")
EOF

rm "$render"
echo "done!"
