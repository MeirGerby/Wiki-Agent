# Linux Pipes and Standard Error
A pipe (|) connects the standard output (stdout) of one command directly into the standard input (stdin) of another command.
By default, error messages are sent to a different stream called standard error (stderr), which bypasses normal pipes unless redirected using 2>&1.
Example: ls nonexistent_folder 2>&1 | grep "No such"
