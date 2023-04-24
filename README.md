# EnjinScraper [![Discord](https://img.shields.io/discord/1099765247344128093.svg?color=%237289da&label=discord)](https://discord.gg/2SfGAMskWt) [![License: AGPL](https://img.shields.io/badge/license-AGPL-blue.svg)](LICENSE) [![npm version](https://badge.fury.io/js/enjinscraper.svg)](https://badge.fury.io/js/enjinscraper)

Scrapes an Enjin site via the Enjin API.

For support, please join the support Discord: https://discord.gg/2SfGAMskWt.

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

Note that if rerunning later, you may need to use `npx enjinscraper@latest` to force use of the latest version.

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
        "galleries": false,
        "news": false,
        "wikis": false,
        "tickets": false,
        "applications": false,
        "comments": false,
        "users": {
            "ips": false,
            "tags": false,
            "fullinfo": true,
            "characters": true,
            "games": true,
            "photos": true,
            "wall": true
        },
        "files": {
            "s3": false,
            "wiki": false,
            "avatars": true,
            "profileCovers": true,
            "gameBoxes": true,
            "userAlbums": true
        }
    },
    "retrySeconds": 5, // Setting to 0 will retry instantly
    "retryTimes": 5, // Setting to 0 will disable retries; setting to -1 will retry indefinitely
    "debug": false,
    "disableSSL": false
}
```

Note that data stemming from user profiles is disabled by default, as this can majorly extend the time needed to scrape sites with large member counts. You can of course change this in `disabledModules.users` You should use an account with the greatest possible permissions, as that will increase the amount of content that can be scraped. Given that, the practical use of this tool is unfortunately limited to those with backend access to the site to be scraped. There is no neeed to enter module IDs, as the scraper will automatically gather info about all modules on the site.

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
- `ticket_replies`: Contains information about replies made to support tickets
- `applications`: Contains basic information about applications
- `application_sections`: Contains sections from applications
- `application_questions`: Contains questions from applications
- `application_questions`: Contains individual responses for applications
- `comments`: Contains information about comments on applications, news articles, wiki pages, and gallery images
- `users`: Contains information about users
- `user_profiles`: Contains information about user profiles, including their personal information, gaming IDs, and social media handles
- `user_games`: Contains information about the games that a user has added to their profile
- `user_characters`: Contains information about the characters that a user has added to their profile
- `user_albums`: Contains information about the albums that a user has created
- `user_images`: Contains information about the images that a user has uploaded
- `user_wall_posts`: Contains information about wall posts made by users
- `user_wall_comments`: Contains information about comments made on wall posts by users
- `user_wall_comment_likes`: Contains information about users who have liked comments on wall posts
- `user_wall_post_likes`: Contains information about users who have liked wall posts


All files scraped will be stored in the `target/files` directory in the same directory as the `config.json` file. The directory structure will simply follow the URL with the `https://` header removed. For example, if the site is `https://www.example.com/somdir/file.png`, the files will be stored in the `target/files/www.example.com/somdir/file.png` directory.

Files that are stored in Enjin's Amazon S3 instance for your site will be automatically downloaded and stored in the `target/files` directory. The files will be stored in the same directory structure as they are on the S3 instance.  All information about these files will be stored in the `s3_files` table in the database. Examples of modules that store files here include galleries, forums, applications, tickets, and news posts.

Files from wiki pages will generally be found under `target/files/s3.amazonaws.com/files.enjin.com/${siteID}/modules/wiki/${wikiPresetID}/file.png`.

User avatars are also scraped, which combines the URLs found in `user_profiles.avatar`, `user_wall_comments.avatar`, and `user_wall_post_likes.avatar`. These will generally be found under `assets-cloud.enjin.com/users/${userID}/avatar/full.${fileID}.png`. Note that these files are generally stored in the database with the size medium, but we download the full size only instead.

Profile cover images come from `user_profiles.cover_image` and are found in either `https://assets-cloud.enjin.com/users/${userID}/cover/${fileID}.png` if the user has uploaded their own cover image, or `resources.enjin.com/${resourceLocator}/themes/${version}/image/profile/cover/${category}/${fileName}.jpg` if the user is using an Enjin provided cover image.

Game boxes are the images displayed for games a user has on their profile. They are found in `assets-cloud.enjin.com/gameboxes/${gameID}/boxmedium.jpg`.

Lastly, user album images from `user_images.url_original` can be found in either `s3.amazonaws.com/assets.enjin.com/users/${userID}/pics/original/${fileName}` or `assets.enjin.com/wall_embed_images/${fileName}`.