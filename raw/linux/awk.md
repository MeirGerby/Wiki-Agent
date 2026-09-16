# Awk Notes
Awk is a powerful pattern scanning and processing language. It treats a file as a structured stream of records (lines) and fields (columns separated by whitespace by default).
$0 represents the whole line, while $1, $2, etc., represent specific columns.
Example: awk '{print $1, $3}' data.txt
It is great for building quick data reports from log files or command outputs.
