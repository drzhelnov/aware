# bibmerge.py v0.1.2
# Version Summary:
# 0.1.1: This is basically the first committed version of the script taken from the Final Paper Outline repo, but incremented the patch number for adding these comment lines referring to the script version. Needless to say that SemVer is used.
# 0.1.2: Fixes the name of the bib file for the .bibpaths case (makes it .bib instead of .bibpaths.bib).

# Credit: ChatGPT September 25 Version (https://help.openai.com/en/articles/6825453-chatgpt-release-notes). Free Research Preview.

# Initial prompt:
# you will write a script in python. it takes from the command line argument a path to a file named *.bibpaths, which is a text file containing a list of directory paths separated by new lines (it can also contain paths to *.bib files). if no arguments are specified, the script presumes the default file is located in the same dir where the script is located and is called ".bibpaths" (i.e., has an empty filename - only the extension). then the script goes recursively over any directories listed in the *.bibpaths file, as well as any their nested directories, looking for *.bib files. any paths to *.bib files listed in the *.bibpaths are also included. then, all of the *.bib files identified are merged into one *.bib file, separated by two new lines, with one new line at the end of file, and saved in the same dir where the script file is located, taking as name the name of the *.bibpaths file (if no argument was specified and a default local .bibpaths file was presumed, then the output file won't have a name, either, only the extension). when reading the contents of the *.bib files identified for merging, you must ensure that utf-8 encoding is used. you also need to make sure that if the dir where the script is located is present among the *.bibpaths entries, any *.bib files from it are processed except for the bib file with the same name as bibpaths (or, in the case of default, the .bib file without the filename).

# Final output, with modifications:

# Here's a Python script that accomplishes the task you described:

import os
import sys

def find_bib_files(directory):
    bib_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".bib"):
                bib_files.append(os.path.join(root, file))
    return bib_files

def merge_bib_files(bib_files, output_file):
    with open(output_file, "w", encoding="utf-8") as output:
        for bib_file in bib_files:
            with open(bib_file, "r", encoding="utf-8") as input_file:
                output.write(input_file.read().strip("\n") + "\n\n")

def main():
    if len(sys.argv) > 1:
        bibpaths_file = sys.argv[1]
    else:
        bibpaths_file = ".bibpaths"

    if os.path.isfile(bibpaths_file):
        with open(bibpaths_file, "r") as f:
            bibpaths = f.read().splitlines()
    else:
        print(f"Error: {bibpaths_file} not found. If you want to use a custom .bibpaths file, pass the path as a script argument.")
        return

    bib_files = []
    for path in bibpaths:
        if path.endswith(".bib"):
            bib_files.append(path)
        elif os.path.isdir(path):
            bib_files.extend(find_bib_files(path))

    # Remove the default bib file from the list
    default_bib_file = os.path.splitext(os.path.basename(bibpaths_file))[0]
    default_bib_file = '' if default_bib_file.startswith('.') else default_bib_file
    bib_files = [file for file in bib_files if os.path.basename(file) != f"{default_bib_file}.bib"]

    if not bib_files:
        print("No .bib files found to merge.")
        return

    output_file = f"{default_bib_file}.bib"
    merge_bib_files(bib_files, output_file)

    print(f"Merged {len(bib_files)} .bib files into {output_file}.")

if __name__ == "__main__":
    main()

# Save this script to a .py file, and you can run it from the command line. Make sure you have Python installed on your system. You can run it with a specific .bibpaths file as an argument, or it will default to looking for a file named .bibpaths in the same directory as the script. It will merge all the .bib files found and save the result in a file with the same name as the .bibpaths file (or just .bib for the default).
