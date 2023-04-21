# EnjinScraper

Scrapes an Enjin site via the Enjin API

API calls used are described in detail [here](https://gist.github.com/Kas-tle/249d73f9f73ae43aa64413ac0ee49a37).

## Usage

Note that this is still a work in progress and as such installation and usage requires manual installation of dependencies and configuration of the `config.json` file. When done, I may opt to publish as a global npm package or distribute as a CLI electron app.

### Quick Run With NPX

#### Windows

Run the following in Powershell:

```ps1
mkdir EnjinScraper
cd EnjinScraper
winget install -e --id OpenJS.NodeJS
npx enjinscraper
```

### Configuration

#### Obtaining an API key

Per Enjin's instructions:

> To enable your API, visit your admin panel / settings / API area. The content on this page includes your base API URL, your secret API key, and the API mode. Ensure that the API mode is set to "Public".

#### Configuring the `config.json`

Optionally, create a `config.json` file in the root directory of the project. Otherwise, you will be prompted for required values on first run. The file should look like this, but with comments omitted:

```jsonc
{
    "apiKey": "someapiKey", // Required
    "domain": "www.example.com", // Required
    "email": "someemail@email.com", // Required
    "password": "somepassword", // Required
    "disabledModules": {
        "forums": false,
        "news": false,
        "wikis": false,
        "tickets": false,
        "applications": false,
        "comments": false,
        "users": false,
        "usertags": false,
        "files": false
    },
    "debug": false
}
```

You should use an account with the greatest possible permissions, as that will increase the amount of content that can be scraped. Given that, the practical use of this tool is unfortunately limited to those with backend access to the site to be scraped. There is no neeed to enter module IDs, as the scraper will automatically gather info about all modules on the site.

### Running Manually

```bash
git clone https://github.com/Kas-tle/EnjinScraper.git
cd EnjinScraper
yarn
npx ts-node index.ts
```

## Outputs

The scraper will output an sqlite file at `target/site.sqlite` in the root directory of the project. For a more detailed database schema, see [OUTPUTS.md](OUTPUTS.md). The database will contain the following tables:
- `scrapers`: Contains information about what steps have been completed to gracefully resume scraping if needed.
- `module_categories`: Enumerates the different cateogries modules can fall into
- `modules`: Contains information about modules
- `presets`: Contains information about presets, essentially a list of individual modules
- `pages`: Contains information about modules in the context of the page they reside on
- `site_data`: A table that stores various information about a website
- `forum_modules`: Contains information about the forum modules that were scraped
- `forums`: Contains information about the forums scraped from the forum modules
- `threads`: Contains information about the threads scraped from the forums
- `posts`: Contains information about the posts scraped from the forums
- `gallery_albums`: Contains information about albums in a gallery, including their titles, descriptions, and images
- `gallery_images`: Contains information about images in a gallery, including their titles, descriptions, and associated albums
- `gallery_tags`: Contains information about tags in a gallery, including their locations and associated images and albums
- `wiki_pages`: Contains information about pages in a wiki, including their content, access control settings, and metadata
- `wiki_revisions`: Contains information about revisions to pages in a wiki, including their content, access control settings, and metadata
- `wiki_likes`: Contains information about users who have liked pages in a wiki
- `wiki_categories`: Contains information about categories in a wiki, including their titles and thumbnails
- `wiki_uploads`: Contains information about uploaded files in a wiki
- `news_articles`: Contains information about news articles scraped from the news modules
- `ticket_modules`: Contains information about ticket modules
- `tickets`: Contains information about tickets scraped from the ticket modules
- `applications`: Contains basic information about applications
- `application_sections`: Contains sections from applications
- `application_questions`: Contains questions from applications
- `application_questions`: Contains individual responses for applications
- `comments`: Contains information about comments on applications, news articles, wiki pages, and gallery images
- `users`: Contains information about users

Files that are stored in Enjin's Amazon S3 instance for your site will be automatically downloaded and stored in the `target/files` directory. The files will be stored in the same directory structure as they are on the S3 instance. The files will be stored in the `target/files` directory in the same directory as the `config.json` file. All information about these files will be stored in the `s3_files` table in the database. Examples of modules that store files here include galleries, forums, applications, tickets, and news posts.

Files from wiki pages will be stored in the `wiki` directory. These do not have a directory structure, so they are simply in the parent folder of the wiki module's preset ID. For example, if the wiki module's preset ID is `123456`, the files will be stored in the `target/files/wiki/123456` directory.

## TODO

- [ ] Add more options for user data scraping (https://github.com/Kas-tle/EnjinScraper/issues/8)
