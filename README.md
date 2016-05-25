browsershots
===

Take screenshots using Phantomjs or Browserstack APIs

CLI
---

    browsershot [general options] <command> [command options]

All commands require the `--backend` flag which chooses which service will be used to create the screenshots. If you don't have a Browserstack plan then `phantomjs` will work locally.

List available browsers:

    browsershot --username myuser --key abc123 list

Take a screenshot and put it in the current directory:

    browsershot --username myuser --key abc123 snap --url https://smallpdf.com

Take a screenshot and put it in another directory:

    browsershot --username myuser --key abc123 snap --output-dir /tmp --url https://smallpdf.com

Read URLs from a file, one URL per file:

    browsershot --username myuser --key abc123 snap --input-file ./urls.txt

All command-line arguments can also be read from file in JSON format:

        browsershot --config ./conf.json list

        $ cat ./conf.json

        {
          "username": "myuser",
          "key": "abc123",
          "backend": "browserstack-screenshot"
        }
