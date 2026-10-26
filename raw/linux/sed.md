# Sed Notes
Sed stands for Stream Editor. It is used to perform basic text transformations on an input stream (a file or input from a pipe).
It works line-by-line and is commonly used for substituting text using the 's' command.
Example: sed 's/apple/orange/g' fruit.txt
You can use regex within sed to target specific patterns.

### `sed` command in Linux

`sed` (Stream Editor) is used to search, replace, delete, and edit text in files directly from the terminal.

### Common examples

| Command                       | What it does                               |
| ----------------------------- | ------------------------------------------ |
| sed 's/old/new/' file.txt     | Replaces the first occurrence on each line |
| sed 's/old/new/g' file.txt    | Replaces all occurrences on each line      |
| sed -i 's/old/new/g' file.txt | Modifies the file directly                 |
| sed -n '5p' file.txt          | Prints line 5 only                         |
| sed -n '2,5p' file.txt        | Prints lines 2–5                           |
| sed '3d' file.txt             | Deletes line 3 from output                 |
| sed '/error/d' file.txt       | Removes lines containing error from output |
| sed -i '3d' file.txt          | Deletes line 3 from the file               |
| sed -n '/error/p' file.txt    | Prints only lines containing error         |

### How substitution works

```bash
sed 's/cat/dog/g' animals.txt
```

* `s` — substitute.

* `cat` — text to find.

* `dog` — replacement text.

* `g` — replace every occurrence on each line.

Important: Without `-i`, `sed` prints the modified text but leaves the original file unchanged.

For safer in-place editing with a backup:

```bash
sed -i.bak 's/old/new/g' file.txt
```

This creates `file.txt.bak` before modifying the original.

