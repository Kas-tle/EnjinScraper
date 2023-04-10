# EnjinScraper

Scrapes an Enjin site via the Enjin API

API calls used are described in detail [here](https://gist.github.com/Kas-tle/249d73f9f73ae43aa64413ac0ee49a37).

## Usage

Note that this is still a work in progress and as such installation and usage requires manual installation of dependencies and configuration of the `config.json` file. When done, I may opt to publish as a global npm package or distribute as a CLI electron app.

### Installation

```bash
git clone https://github.com/Kas-tle/EnjinScraper.git
cd EnjinScraper
yarn
```

### Configuration

#### Obtaining an API key

Per Enjin's instructions:

> To enable your API, visit your admin panel / settings / API area. The content on this page includes your base API URL, your secret API key, and the API mode. Ensure that the API mode is set to "Public".

#### Obtaining Forum Module IDs

This can be obtained in the admin panel of your site under "Modules". Using the left side panel, you can filter to the type "Forum Board". Make a list of the Module IDs you wish to scrape in the `config.json` file as shown below.

#### Obtaining News Module IDs

This can be obtained in the admin panel of your site under "Modules". Using the left side panel, you can filter to the type "News / Blog". Make a list of the Module IDs you wish to scrape in the `config.json` file as shown below.

#### Configuring the `config.json`

Create a `config.json` file in the root directory of the project. The file should look like this:

```jsonc
{
    "apiKey": "someapiKey", // Required
    "domain": "www.example.com", // Required
    "email": "someemail@email.com", // Required
    "password": "somepassword", // Required
    "sessionID": "someSessionID", // Optional, otherwise it will be fetched automatically
    "forumModuleIDs": [ // Optional, otherwise no forums will be scraped
        "1000001",
        "1000002"
    ],
    "newsModuleIDs": [ // Optional, otherwise no news will be scraped
        "1000001",
        "1000002"
    ],
    "disabledModules": {
        "forums": false,
        "news": false,
        "tickets": false,
        "applications": false,
        "users": false,
        "usertags": true
    },
    "debug": false
}
```

### Running

```bash
npx ts-node index.ts
```

## Outputs

The scraper will output an sqlite file at `target/site.sqlite` in the root directory of the project. For a more detailed database schema, see [OUTPUTS.md](OUTPUTS.md). The database will contain the following tables:
- `scrapers`: Contains information about what steps have been completed to gracefully resume scraping if needed.
- `forum_modules`: Contains information about the forum modules that were scraped
- `forums`: Contains information about the forums scraped from the forum modules
- `threads`: Contains information about the threads scraped from the forums
- `posts`: Contains information about the posts scraped from the forums
- `news_articles`: Contains information about news articles scraped from the news modules
- `ticket_modules`: Contains information about ticket modules
- `tickets`: Contains information about tickets scraped from the ticket modules
- `applications`: Contains information about applications
- `users`: Contains information about users

## TODO

- [ ] Add support for scraping wikis (https://github.com/Kas-tle/EnjinScraper/issues/5)
- [ ] Add support for downloading referenced images and attachments (https://github.com/Kas-tle/EnjinScraper/issues/4)
- [ ] Add more options for user data scraping (https://github.com/Kas-tle/EnjinScraper/issues/8)
- [ ] Add support for scraping galleries (https://github.com/Kas-tle/EnjinScraper/issues/6)
- [ ] Export to database
