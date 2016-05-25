browsershots
===

Take screenshots using Phantomjs or Browserstack APIs

CLI
---

    browsershot [general options] <command> [command options]

All commands require the `--backend` flag which chooses which service will be used to create the screenshots. If you don't have a Browserstack plan then `phantomjs` will work locally.

List available browsers:

    browsershot --username user@example.com --key abc123 list

Take a screenshot and put it in the current directory:

    browsershot --user user@example.com --key abc123 snap --url https://smallpdf.com

Take a screenshot and put it in another directory:

    browsershot --user user@example.com --key abc123 snap --output-dir /tmp --url https://smallpdf.com

All command-line arguments can also be read from file in JSON format:

        browsershot --config ./creds.json list

Planned features:

Read URLs from a file, one URL per file:

    browsershot --user user@example.com --key abc123 snap --input-file ./urls.txt

All command-line params can also be given as environment variables, in uppercase and prepended by BROWSERSHOT_ e.g. the previous command could be written as:

    BROWSERSHOT_USER=user@example.com BROWSERSHOT_KEY=abc123 BROWSERSHOT_FILE=./urls.txt browsershot
