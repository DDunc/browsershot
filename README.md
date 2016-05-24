browsershots
===

Access the browserstack Screenshots API

CLI
---

    browsershot [options] <command> [options]

List available browsers:

    browsershot --user user@example.com --password abc123 list

Take a screenshot and put it in the current directory:

    browsershot --user user@example.com --password abc123 --url http://bbc.co.uk

Read URLs from a file, one URL per file:

    browsershot --user user@example.com --password abc123 --file ./urls.txt

All command-line params can also be given as environment variables, in uppercase and prepended by BROWSERSHOT_ e.g. the previous command could be written as:

    BROWSERSHOT_USER=user@example.com BROWSERSHOT_PASSWORD=abc123 BROWSERSHOT_FILE=./urls.txt browsershot

All command-line arguments can also be read from file in JSON format:

    browsershot --config ./creds.json --list
