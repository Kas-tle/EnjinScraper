# Outputs

- [Outputs](#outputs)
  * [Database Tables](#database-tables)
    + [Utility](#utility)
    + [Site Data](#site-data)
      - [Module Categories](#module-categories)
      - [Modules](#modules)
      - [Presets](#presets)
      - [Pages](#pages)
      - [Site Data](#site-data-1)
    + [Forums](#forums)
      - [Forum Modules](#forum-modules)
      - [Forums](#forums-1)
      - [Threads](#threads)
      - [Posts](#posts)
    + [News](#news)
      - [News Articles](#news-articles)
    + [Tickets](#tickets)
      - [Ticket Modules](#ticket-modules)
      - [Tickets](#tickets-1)
    + [Applications](#applications)
      - [Applications](#applications-1)
      - [Applications Sections](#applications-sections)
      - [Applications Questions](#applications-questions)
      - [Applications Responses](#applications-responses)
    + [Comments](#comments)
      - [Comments](#comments-1)
    + [Users](#users)
      - [Users](#users-1)
  * [Images](#images)
  * [Debug](#debug)

## Database Tables

### Utility

Theses tables are used to store information about the scraping process.

- `scrapers`: Contains information about what steps have been completed to gracefully resume scraping if needed. For a more detailed database schema, see OUTPUTS.md.
    - `module`: The module that was scraped (`TEXT PRIMARY KEY`)
    - `scraped`: Whether or not the module was scraped (`BOOLEAN`)

### Site Data

These tables are used to store information about overall site data and ultimately help us fetch other downstream data via the API.

#### Module Categories

- `module_categories`: Enumerates the different cateogries modules can fall into
    - `category_id`: The ID of the category (`TEXT PRIMARY KEY`)
    - `title`: The title of the category (`TEXT`)
    - `order`: The order of the category (`TEXT`)
    - `platform`: The platform of the category (`TEXT`)
    - `webpush_title`: The webpush title of the category (`TEXT`)
    - `regular_title`: The regular title of the category (`TEXT`)

#### Modules

- `modules`: Contains information about modules
    - `rid`: The RID of the module (`TEXT`)
    - `category_id`: The ID of the category the module belongs to (`TEXT`)
    - `module_id`: The ID of the module (`TEXT PRIMARY KEY`)
    - `title`: The title of the module (`TEXT`)
    - `description`: The description of the module (`TEXT`)
    - `image`: The image of the module (`TEXT`)
    - `order`: The order of the module (`TEXT`)
    - `platform`: The platform of the module (`TEXT`)
    - `webpush_title`: The webpush title of the module (`TEXT`)
    - `listed`: Whether or not the module is listed (`TEXT`)
    - `allow_create`: Whether or not the module is allowed to be created (`TEXT`)
    - `module_type`: The type of the module (`TEXT`)
    - `help_guide_url`: The URL of the help guide of the module (`TEXT`)
    - `notes`: The notes of the module (`TEXT`)
    - `min_width`: The minimum width of the module (`TEXT`)
    - `video_html`: The video HTML of the module (`TEXT`)
    - `released`: Whether or not the module has been released (`TEXT`)

#### Presets

- `presets`: Contains information about presets, essentially a list of individual modules
    - `preset_id`: The ID of the preset (`TEXT PRIMARY KEY`)
    - `category_id`: The ID of the category the preset belongs to (`TEXT`)
    - `name`: The name of the preset (`TEXT`)
    - `admin_access`: The admin access of the preset (`TEXT`)
    - `admin_access_tags`: The admin access tags of the preset (`TEXT`)
    - `disabled`: Whether or not the preset is disabled (`BOOLEAN`)
    - `module_id`: The ID of the module the preset is associated with (`TEXT REFERENCES modules(module_id)`)
    - `module_type`: The type of the module the preset is associated with (`TEXT`)

#### Pages

- `pages`: Contains information about modules in the context of the page they reside on
    - `site_id`: The ID of the site associated with the page (`TEXT`)
    - `url`: The URL of the page (`TEXT`)
    - `page_id`: The ID of the page (`TEXT PRIMARY KEY`)
    - `pagename`: The name of the page (`TEXT`)
    - `section_id`: The ID of the section the page belongs to (`TEXT`)
    - `section_type`: The type of the section the page belongs to (`TEXT`)
    - `section_width`: The width of the section the page belongs to (`TEXT`)
    - `section_type2`: The type of the section the page belongs to (`TEXT`)
    - `section_name`: The name of the section the page belongs to (`TEXT`)
    - `container_id`: The ID of the container the page belongs to (`TEXT`)
    - `container_title`: The title of the container the page belongs to (`TEXT`)
    - `container_footer`: The footer of the container the page belongs to (`TEXT`)
    - `container_footer_url`: The URL of the footer of the container the page belongs to (`TEXT`)
    - `container_footer_window`: The window of the footer of the container the page belongs to (`TEXT`)
    - `container_position`: The position of the container the page belongs to (`TEXT`)
    - `container_graphics`: The graphics of the container the page belongs to (`TEXT`)
    - `rows`: The rows of the page (`TEXT`)
    - `columns`: The columns of the page (`TEXT`)
    - `acl_access`: The access of the ACL (`TEXT`)
    - `collapsible_container`: Whether or not the container of the page is collapsible (`TEXT`)
    - `start_collapsed`: Whether or not the container of the page is initially collapsed (`TEXT`)
    - `rid`: The ID of the page's RID (`TEXT`)
    - `preset_id`: The ID of the preset associated with the page (`TEXT REFERENCES presets(preset_id)`)
    - `row`: The row of the page (`TEXT`)
    - `column`: The column of the page (`TEXT`)
    - `module_width`: The width of the module on the page (`TEXT`)
    - `module_name`: The name of the module on the page (`TEXT`)
    - `disabled`: Whether or not the module on the page is disabled (`TEXT`)
    - `module_type`: The type of the module on the page (`TEXT`)

#### Site Data

- `site_data`: A table that stores various information about a website
    `site_id`: The ID of the website (`TEXT PRIMARY KEY`).
    `sites_games`: A JSON object that contains data about the games available on the site (`JSON`)
    `plan`: A JSON object that contains data about the current plan of the site (`JSON`)
    `licenses`: A JSON object that contains data about the licenses used by the site (`JSON`)

### Forums

These tables are used to store information about the forum modules that were scraped.

#### Forum Modules

- `forum_modules`: Contains information about the forum modules that were scraped
    - `preset_id`: The forum module ID (`TEXT PRIMARY KEY`)
    - `title_welcome`: The welcome message for the forum module (`TEXT`)
    - `subforums`: The subforums for the forum module (`JSON`)
    - `total_threads`: The total number of threads in the forum module (`INTEGER`)
    - `total_posts`: The total number of posts in the forum module (`INTEGER`)
    - `category_names`: The category names for the forum module (`JSON`)
    - `notice`: The notice for the forum module (`JSON`)

#### Forums

- `forums`: Contains information about the forums scraped from the forum modules
    - `title_welcome`: The welcome message for the forum (`TEXT`)
    - `show_forum_viewers`: Whether or not to show the forum viewers (`TEXT`)
    - `preset_id`: The ID of the forum module this forum belongs to (`TEXT REFERENCES forum_modules(preset_id)`)
    - `category_id`: The ID of the category the forum belongs to (`TEXT`)
    - `forum_id`: The ID of the forum (`TEXT PRIMARY KEY`)
    - `category_name`: The name of the category the forum belongs to (`TEXT`)
    - `category_order`: The order of the category the forum belongs to (`TEXT`)
    - `collapsed`: Whether or not the forum is collapsed (`TEXT`)
    - `forum_name`: The name of the forum (`TEXT`)
    - `forum_description`: The description of the forum (`TEXT`)
    - `view_access`: The access required to view the forum (`TEXT`)
    - `view_access_tag`: The tag required to view the forum (`TEXT`)
    - `post_access`: The access required to post in the forum (`TEXT`)
    - `post_access_tag`: The tag required to post in the forum (`TEXT`)
    - `moderation_access`: The access required to moderate the forum (`TEXT`)
    - `moderation_access_tag`: The tag required to moderate the forum (`TEXT`)
    - `forum_order`: The order of the forum (`TEXT`)
    - `forum_threads`: The number of threads in the forum (`TEXT`)
    - `forum_posts`: The number of posts in the forum (`TEXT`)
    - `forum_lastthread_id`: The ID of the last thread in the forum (`TEXT`)
    - `poll_enabled`: Whether or not polls are enabled in the forum (`TEXT`)
    - `email_notifications`: Whether or not email notifications are enabled in the forum (`TEXT`)
    - `parent_id`: The ID of the parent forum, if any (`TEXT`)
    - `disable_signature`: Whether or not signatures are disabled in the forum (`TEXT`)
    - `disable_user_post_count`: Whether or not user post count is disabled in the forum (`TEXT`)
    - `disable_voting`: Whether or not voting is disabled in the forum (`TEXT`)
    - `fb_like_enabled`: Whether or not Facebook like is enabled in the forum (`TEXT`)
    - `twitter_enabled`: Whether or not Twitter is enabled in the forum (`TEXT`)
    - `disable_sharing_links`: Whether or not sharing links are disabled in the forum (`TEXT`)
    - `remove_filters`: Whether or not filters are removed in the forum (`TEXT`)
    - `users_see_own_threads`: Whether or not users can see their own threads in the forum (`TEXT`)
    - `minimum_posts_to_post`: The minimum number of posts required to post in the forum (`TEXT`)
    - `minimum_posts_to_view`: The minimum number of posts required to view the forum (`TEXT`)
    - `forum_type`: The type of the forum (`TEXT`)
    - `redirect_url`: The URL the forum redirects to, if any (`TEXT`)
    - `redirect_type`: The type of redirect the forum uses, if any (`TEXT`)
    - `bottom_breadcrumbs`: Whether or not to display the bottom breadcrumbs in the forum (`TEXT`)
    - `unread_icon`: The icon to use for unread threads in the forum (`TEXT`)
    - `read_icon`: The icon to use for read threads in the forum (`TEXT`)
    - `lock_own_threads`: Whether or not users can lock their own threads in the forum (`TEXT`)
    - `users_see_own_edit`: Whether or not users can see their own edit history in the forum (`TEXT`)
    - `character_game_rid`: The ID of the game that the forum belongs to (`TEXT`)
    - `character_game_serverid`: The server ID of the game that the forum belongs to (`TEXT`)
    - `unlock_own_threads`: Whether or not users can unlock their own threads in the forum (`TEXT`)
    - `disable_sharing_images`: Whether or not sharing images are disabled in the forum (`TEXT`)
    - `thread_id`: The ID of the thread (`TEXT`)
    - `thread_subject`: The subject of the thread (`TEXT`)
    - `thread_lastpost_time`: The timestamp of the last post in the thread (`TEXT`)
    - `thread_lastpost_user_id`: The ID of the user who made the last post in the thread (`TEXT`)
    - `thread_lastpost_username`: The username of the user who made the last post in the thread (`TEXT`)
    - `thread_replies`: The number of replies in the thread (`TEXT`)
    - `user_id`: The ID of the user who posted in the thread (`TEXT`)
    - `username`: The username of the user who posted in the thread (`TEXT`)
    - `displayname`: The display name of the user who posted in the thread (`TEXT`)
    - `subscription`: The subscription status of the user who posted in the thread (`TEXT`)
    - `read_time`: The timestamp when the user last read the thread (`TEXT`)
    - `category_collapsed_state`: The collapsed state of the category the forum belongs to (`TEXT`)
    - `unread`: Whether or not the thread is unread (`BOOLEAN`)
    - `is_collapsed`: Whether or not the forum is collapsed (`BOOLEAN`)
    - `parent_forum_name`: The name of the parent forum, if any (`TEXT`)
    - `parent_forum_name_2`: The name of the second parent forum, if any (`TEXT`)
    - `parent_forum_id_2`: The ID of the second parent forum, if any (`TEXT`)
    - `require_game_character`: Whether or not a game character is required to post in the forum (`BOOLEAN`)
    - `logo_url`: The URL of the forum's logo (`TEXT`)
    - `unread_threads`: The number of unread threads in the forum (`INTEGER`)
    - `announcement_global`: Global announcements for the forum (`JSON`)
    - `announcement_local`: Local announcements for the forum (`JSON`)
    - `sticky`: Sticky threads in the forum (`JSON`)
    - `notices`: Notices for the forum (`JSON`)

#### Threads

- `threads`: Contains information about the threads scraped from the forums
    - `forum_id`: The ID of the forum the thread belongs to (`TEXT REFERENCES forums(forum_id)`)
    - `preset_id`: The ID of the forum module the thread belongs to (`TEXT REFERENCES forum_modules(preset_id)`)
    - `thread_id`: The ID of the thread (`TEXT PRIMARY KEY`)
    - `thread_subject`: The subject of the thread (`TEXT`)
    - `thread_replies`: The number of replies in the thread (`TEXT`)
    - `thread_views`: The number of views in the thread (`TEXT`)
    - `thread_type`: The type of the thread (`TEXT`)
    - `thread_status`: The status of the thread (`TEXT`)
    - `thread_user_id`: The ID of the user who created the thread (`TEXT`)
    - `thread_username`: The username of the user who created the thread (`TEXT`)
    - `thread_avatar`: The avatar of the user who created the thread (`TEXT`)
    - `thread_lastpost_user_id`: The ID of the user who made the last post in the thread (`TEXT`)
    - `thread_lastpost_username`: The username of the user who made the last post in the thread (`TEXT`)
    - `thread_lastpost_time`: The timestamp of the last post in the thread (`TEXT`)
    - `username`: The username of the user who made the last post in the thread (`TEXT`)
    - `thread_moved_id`: The ID of the thread the current thread was moved from, if any (`TEXT`)
    - `thread_post_time`: The timestamp of when the thread was created (`TEXT`)
    - `url`: The URL of the thread (`TEXT`)
    - `post_count`: The number of posts in the thread (`TEXT`)
    - `category_id`: The ID of the category the thread belongs to (`TEXT`)
    - `subscription`: The subscription status of the thread (`TEXT`)
    - `moved_forum_id`: The ID of the forum the thread was moved to, if any (`TEXT`)
    - `thread_hot`: Whether or not the thread is hot (`BOOLEAN`)
    - `thread_new`: Whether or not the thread is new (`BOOLEAN`)
    - `replied_to`: Whether or not the thread has been replied to (`BOOLEAN`)
    - `avatar`: The avatar of the user who made the last post in the thread (`TEXT`)
    - `unread_posts`: The number of unread posts in the thread (`TEXT`)
    - `labels`: The labels of the thread (`TEXT`)
    - `forum_name`: The name of the forum the thread belongs to (`TEXT`)
    - `forum_description`: The description of the forum the thread belongs to (`TEXT`)
    - `disable_voting`: Whether or not voting is disabled in the thread (`TEXT`)
    - `show_signature`: Whether or not the signature is shown in the thread (`TEXT`)
    - `url_cms`: The URL of the CMS the thread belongs to, if any (`TEXT`)

#### Posts

- `posts`: Contains information about the posts scraped from the forums
    - `post_id`: The ID of the post (`TEXT PRIMARY KEY`)
    - `post_time`: The timestamp of the post (`TEXT`)
    - `post_content`: The content of the post (`TEXT`)
    - `post_content_html`: The HTML-formatted content of the post (`TEXT`)
    - `post_content_clean`: The cleaned content of the post (`TEXT`)
    - `post_user_id`: The ID of the user who made the post (`TEXT`)
    - `show_signature`: Whether or not the signature is shown in the post (`TEXT`)
    - `last_edit_time`: The timestamp of the last edit of the post (`TEXT`)
    - `post_votes`: The votes for the post (`TEXT`)
    - `post_unhidden`: Whether or not the post is unhidden (`TEXT`)
    - `post_admin_hidden`: Whether or not the post is hidden by an admin (`TEXT`)
    - `post_locked`: Whether or not the post is locked (`TEXT`)
    - `last_edit_user`: The user who made the last edit of the post (`TEXT`)
    - `votes`: The votes for the post (`JSON`)
    - `post_username`: The username of the user who made the post (`TEXT`)
    - `avatar`: The avatar of the user who made the post (`TEXT`)
    - `user_online`: Whether or not the user who made the post is online (`BOOLEAN`)
    - `user_votes`: The votes of the user who made the post (`TEXT`)
    - `user_posts`: The number of posts of the user who made the post (`TEXT`)
    - `url`: The URL of the post (`TEXT`)

### Wikis

These tables are used to store information about the wikis scraped.

#### Wiki Pages

- `wiki_pages`: Contains information about pages in a wiki, including their content, access control settings, and metadata
    - `preset_id`: The ID of the wiki module preset (`TEXT`)
    - `page_id`: The unique ID of the page (`TEXT PRIMARY KEY`)
    - `page_namespace`: The namespace of the page (`TEXT`)
    - `page_title`: The title of the page (`TEXT`)
    - `page_is_redirect`: Whether or not the page is a redirect (`TEXT`)
    - `page_is_new`: Whether or not the page is new (`TEXT`)
    - `page_touched`: The timestamp of the last time the page was touched (`TEXT`)
    - `page_links_updated`: The timestamp of the last time the page's links were updated (`TEXT`)
    - `page_latest`: The ID of the latest revision of the page (`TEXT`)
    - `page_len`: The length of the page (`TEXT`)
    - `page_content_model`: The content model of the page (`TEXT`)
    - `page_lang`: The language of the page (`TEXT`)
    - `view_access_acl`: The access control list for viewing the page (`TEXT`)
    - `edit_access_acl`: The access control list for editing the page (`TEXT`)
    - `comment_access_acl`: The access control list for commenting on the page (`TEXT`)
    - `rev_id`: The ID of the page revision (`TEXT`)
    - `rev_timestamp`: The timestamp of the revision (`TEXT`)
    - `rev_user`: The ID of the user who made the revision (`TEXT`)
    - `rev_user_text`: The username of the user who made the revision (`TEXT`)
    - `rev_comment`: The comment for the revision (`TEXT`)
    - `rev_parent_id`: The ID of the parent revision (`TEXT`)
    - `text_text`: The text content of the revision (`TEXT`)
    - `rd_title`: The title of the page the redirect points to, if applicable (`TEXT`)
    - `page_title_display`: The displayed title of the page (`TEXT`)
    - `current_timestamp`: The current timestamp (`INTEGER`)
    - `view_access`: The access level required to view the page (`TEXT`)
    - `edit_access`: The access level required to edit the page (`TEXT`)
    - `comment_access`: The access level required to comment on the page (`TEXT`)
    - `avatar`: The URL of the user's avatar (`TEXT`)
    - `text_display`: The displayed text content of the revision (`TEXT`)
    - `categories`: A JSON object containing the categories for the page (`JSON`)
    - `comments_total`: The total number of comments on the page (`TEXT`)
    - `comment_cid`: The ID of the comment (`TEXT`)
    - `likes_total`: The total number of likes on the page (`TEXT`)

#### Wiki Revisions

- `wiki_revisions`: Contains information about revisions to pages in a wiki, including their content, access control settings, and metadata
    - `preset_id`: The ID of the wiki module preset (`TEXT`)
    - `page_id`: The unique ID of the page (`TEXT`)
    - `page_namespace`: The namespace of the page (`TEXT`)
    - `page_title`: The title of the page (`TEXT`)
    - `page_is_redirect`: Whether or not the page is a redirect (`TEXT`)
    - `page_is_new`: Whether or not the page is new (`TEXT`)
    - `page_is_touched`: Whether or not the page has been touched (`TEXT`)
    - `page_links_updated`: The timestamp of the last time the page's links were updated (`TEXT`)
    - `page_latest`: The ID of the latest revision of the page (`TEXT`)
    - `page_len`: The length of the page (`TEXT`)
    - `page_content_model`: The content model of the page (`TEXT`)
    - `page_lang`: The language of the page (`TEXT`)
    - `view_access_acl`: The access control list for viewing the page (`TEXT`)
    - `edit_access_acl`: The access control list for editing the page (`TEXT`)
    - `comment_access_acl`: The access control list for commenting on the page (`TEXT`)
    - `rev_id`: The unique ID of the revision (`TEXT PRIMARY KEY`)
    - `rev_timestamp`: The timestamp of the revision (`TEXT`)
    - `rev_user`: The ID of the user who made the revision (`TEXT`)
    - `rev_user_text`: The username of the user who made the revision (`TEXT`)
    - `rev_comment`: The comment for the revision (`TEXT`)
    - `rev_parent_id`: The ID of the parent revision (`TEXT`)
    - `rev_minor_edit`: Whether or not the revision is a minor edit (`TEXT`)
    - `rev_deleted`: Whether or not the revision is deleted (`TEXT`)
    - `rev_len`: The length of the revision (`TEXT`)
    - `rev_sha1`: The SHA-1 hash of the revision (`TEXT`)
    - `rev_content_format`: The content format of the revision (`TEXT`)
    - `rev_content_model`: The content model of the revision (`TEXT`)
    - `avatar`: The URL of the user's avatar (`TEXT`)
    - `text_text`: The text content of the revision (`TEXT`)
    - `rd_title`: The title of the page the redirect points to, if applicable (`TEXT`)
    - `page_title_display`: The displayed title of the page (`TEXT`)
    - `current_timestamp`: The current timestamp (`TEXT`)
    - `view_access`: The access level required to view the page (`TEXT`)
    - `edit_access`: The access level required to edit the page (`TEXT`)
    - `comment_access`: The access level required to comment on the page (`TEXT`)
    - `text_display`: The displayed text content of the revision (`TEXT`)
    - `categories`: A JSON object containing the categories for the page (`JSON`)

#### Wiki Likes

- `wiki_likes`: Contains information about users who have liked pages in a wiki
    - `preset_id`: The ID of the wiki module preset (`TEXT`)
    - `page_id`: The unique ID of the page (`TEXT`)
    - `user_id`: The ID of the user who liked the page (`TEXT`)
    - `username`: The username of the user who liked the page (`TEXT`)
    - `avatar`: The URL of the user's avatar (`TEXT`)

#### Wiki Categories

- `wiki_categories`: Contains information about categories in a wiki, including their titles and thumbnails
    - `preset_id`: The ID of the wiki module preset (`TEXT`)
    - `page_title`: The title of the page associated with the category (`TEXT`)
    - `page_title_dbkey`: The database key of the page associated with the category (`TEXT`)
    - `page_title_display`: The displayed title of the page associated with the category (`TEXT`)
    - `category_thumbnail`: The URL of the thumbnail for the category (`TEXT`)
    - `category_thumbnail_path`: The path to the thumbnail for the category (`TEXT`)
    - `cl_to`: The name of the category (`TEXT`)
    - `cl_type`: The type of the category (`TEXT`)

#### Wiki Uploads

- `wiki_uploads`: Contains information about uploaded files in a wiki
    - `preset_id`: The ID of the wiki module preset (`TEXT`)
    - `path`: The path to the uploaded file (`TEXT`)
    - `name`: The name of the uploaded file (`TEXT`)

### News

These tables are used to store information about the news modules that were scraped.

#### News Articles

- `news_articles`: Contains information about news articles
    - `article_id`: The ID of the news article (`TEXT PRIMARY KEY`)
    - `module_id`: The ID of the news module the news article belongs to (`TEXT`)
    - `user_id`: The ID of the user who posted the news article (`TEXT`)
    - `num_comments`: The number of comments on the news article (`INTEGER`)
    - `timestamp`: The timestamp of the news article (`TEXT`)
    - `status`: The status of the news article (`TEXT`)
    - `title`: The title of the news article (`TEXT`)
    - `content`: The content of the news article (`TEXT`)
    - `commenting_mode`: The commenting mode for the news article (`TEXT`)
    - `ordering`: The ordering for the news article (`TEXT`)
    - `sticky`: Whether or not the news article is sticky (`TEXT`)
    - `last_updated`: The timestamp of the last update of the news article (`TEXT`)
    - `username`: The username of the user who posted the news article (`TEXT`)
    - `displayname`: The display name of the user who posted the news article (`TEXT`)
    - `comment_cid`: The comment container id for comments on the news article (`TEXT`)

### Tickets

These tables are used to store information about the ticket modules that were scraped.

#### Ticket Modules

- `ticket_modules`: Contains information about ticket modules
    - `module_name`: The name of the ticket module (`TEXT PRIMARY KEY`)
    - `questions`: The questions for the ticket module (`JSON`)

#### Tickets

- `tickets`: Contains information about tickets
    - `id`: The ID of the ticket (`TEXT PRIMARY KEY`)
    - `code`: The code of the ticket (`TEXT`)
    - `site_id`: The ID of the site the ticket belongs to (`TEXT`)
    - `preset_id`: The ID of the ticket module the ticket belongs to (`TEXT`)
    - `subject`: The subject of the ticket (`TEXT`)
    - `created`: The timestamp of when the ticket was created (`TEXT`)
    - `status`: The status of the ticket (`TEXT`)
    - `assignee`: The assignee of the ticket (`TEXT`)
    - `updated`: The timestamp of when the ticket was last updated (`TEXT`)
    - `requester`: The requester of the ticket (`TEXT`)
    - `priority`: The priority of the ticket (`TEXT`)
    - `extra_questions`: The extra questions for the ticket (`TEXT`)
    - `status_change`: The status change for the ticket (`TEXT`)
    - `email`: The email of the ticket (`TEXT`)
    - `viewers`: Whether or not viewers are allowed for the ticket (`BOOLEAN`)
    - `createdHTML`: The HTML-formatted timestamp of when the ticket was created (`TEXT`)
    - `updatedHTML`: The HTML-formatted timestamp of when the ticket was last updated (`TEXT`)
    - `requesterHTML`: The HTML-formatted requester of the ticket (`TEXT`)
    - `assigneeText`: The text representation of the assignee of the ticket (`TEXT`)
    - `assigneeHTML`: The HTML-formatted assignee of the ticket (`TEXT`)
    - `priority_name`: The name of the priority of the ticket (`TEXT`)
    - `replies_count`: The number of replies to the ticket (`INTEGER`)
    - `private_reply_count`: The number of private replies to the ticket (`INTEGER`)
    - `replies`: The replies to the ticket (`JSON`)
    - `has_uploads`: Whether or not the ticket has uploads (`BOOLEAN`)

### Applications

These tables are used to store information about the applications that were scraped.

#### Applications

- `applications`: Contains basic information about applications
    - `preset_id`: The preset ID of the application (`TEXT PRIMARY KEY`)
    - `title`: The title of the application (`TEXT`)
    - `post_app_comments`: Whether or not to allow comments on the application (`BOOLEAN`)
    - `allow_admin_comments`: Whether or not to allow admin comments on the application (`BOOLEAN`)\

#### Applications Sections

- `application_sections`: Contains sections from applications
    - `section_id`: The ID of the section (`TEXT PRIMARY KEY`)
    - `preset_id`: The preset ID of the application the section belongs to (`TEXT REFERENCES applications(preset_id)`)
    - `title`: The title of the section (`TEXT`)
    - `new_page`: Whether or not to open the section in a new page (`TEXT`)
    - `hide_title`: Whether or not to hide the title of the section (`TEXT`)
    - `delta`: The delta value of the section (`TEXT`)
    - `description`: The description of the section (`TEXT`)
    - `conditions`: The conditions for the section (`JSON`)
    - `visible`: Whether or not the section is visible (`BOOLEAN`)
    - `header`: The header of the section (`TEXT`)

#### Applications Questions

- `application_questions`: Contains questions from applications
    - `hash`: The hash of the question (`TEXT PRIMARY KEY`)
    - `preset_id`: The preset ID of the application the question belongs to (`TEXT REFERENCES applications(preset_id)`)
    - `delta`: The delta value of the question (`TEXT`)
    - `data`: The data of the question (`JSON`)
    - `conditions`: The conditions for the question (`JSON`)
    - `section_id`: The ID of the section the question belongs to (`TEXT`)
    - `data_old`: The old data of the question (`JSON`)
    - `visible`: Whether or not the question is visible (`BOOLEAN`)
    - `widget`: The widget of the question (`TEXT`)

#### Applications Responses

- `application_responses`: Contains individual responses for applications
    - `application_id`: The ID of the application (`TEXT PRIMARY KEY`)
    - `site_id`: The ID of the site the application belongs to (`TEXT`)
    - `preset_id`: The ID of the application module the application belongs to (`TEXT`)
    - `title`: The title of the application (`TEXT`)
    - `user_ip`: The IP address of the user who submitted the application (`TEXT`)
    - `is_mine`: Whether or not the application was submitted by the current user (`BOOLEAN`)
    - `can_manage`: Whether or not the current user can manage the application (`BOOLEAN`)
    - `created`: The timestamp of when the application was created (`TEXT`)
    - `updated`: The timestamp of when the application was last updated (`TEXT`)
    - `read`: The timestamp of when the application was read (`TEXT`)
    - `comments`: The number of comments on the application (`INTEGER`)
    - `read_comments`: The timestamp of when the comments on the application were read (`TEXT`)
    - `app_comments`: The comments on the application (`TEXT`)
    - `admin_comments`: The admin comments on the application (`TEXT`)
    - `site_name`: The name of the site the application belongs to (`TEXT`)
    - `user_id`: The ID of the user who submitted the application (`TEXT`)
    - `is_online`: Whether or not the user who submitted the application is online (`BOOLEAN`)
    - `admin_online`: Whether or not the admin who reviewed the application is online (`BOOLEAN`)
    - `username`: The username of the user who submitted the application (`TEXT`)
    - `avatar`: The avatar of the user who submitted the application (`TEXT`)
    - `admin_user_id`: The ID of the admin who reviewed the application (`TEXT`)
    - `admin_username`: The username of the admin who reviewed the application (`TEXT`)
    - `admin_avatar`: The avatar of the admin who reviewed the application (`TEXT`)
    - `site_logo`: The logo of the site the application belongs to (`TEXT`)
    - `user_data`: The user data for the application (`JSON`)
    - `is_archived`: Whether or not the application is archived (`BOOLEAN`)
    - `is_trashed`: Whether or not the application is trashed (`BOOLEAN`)
    - `allow_app_comments`: Whether or not app comments are allowed (`STRING`)
    - `post_app_comments`: Whether or not app comments can be posted (`BOOLEAN`)
    - `allow_admin_comments`: Whether or not admin comments are allowed (`BOOLEAN`)
    - `comment_cid`: The comment container id for comments on the application (`TEXT`)

### Comments

These tables are used to store information about the comments on applications and news articles that were scraped.

#### Comments

- `comments`: Contains information about comments
    - `comment_cid`: The comment CID (`TEXT`)
    - `comment_id`: The comment ID (`TEXT PRIMARY KEY`)
    - `user_id`: The ID of the user who posted the comment (`TEXT`)
    - `guest_ip`: The IP address of the guest who posted the comment (`TEXT`)
    - `guest_name`: The name of the guest who posted the comment (`TEXT`)
    - `timestamp`: The timestamp of when the comment was posted (`TEXT`)
    - `content`: The content of the comment (`TEXT`)
    - `status`: The status of the comment (`TEXT`)
    - `category`: The category of the comment (`TEXT`)
    - `parent_comment_id`: The ID of the parent comment (`TEXT`)
    - `likes_user_ids`: The IDs of the users who liked the comment (`JSON`)
    - `likes`: The number of likes the comment has (`JSON`)
    - `likes_users`: The users who liked the comment (`TEXT`)
    - `likes_users_full`: The full user information of the users who liked the comment (`TEXT`)
    - `ajax_like`: Whether or not the comment can be liked (`TEXT`)
    - `can_delete`: Whether or not the comment can be deleted (`BOOLEAN`)
    - `can_reply`: Whether or not the comment can be replied to (`BOOLEAN`)
    - `avatar`: The avatar of the user who posted the comment (`TEXT`)
    - `username`: The username of the user who posted the comment (`TEXT`)
    - `time`: The time of when the comment was posted (`TEXT`)
    - `can_like`: Whether or not the user can like the comment (`BOOLEAN`)
    - `like_text`: The text for the like button (`TEXT`)
    - `tag_post_color`: Whether or not the tag post color is enabled (`BOOLEAN`)

### Users

These tables are used to store information about the users that were scraped.

#### Users

- `users`: Contains information about users
    - `user_id`: The ID of the user (`TEXT PRIMARY KEY`)
    - `username`: The username of the user (`TEXT`)
    - `forum_post_count`: The number of posts the user has made in the forum (`TEXT`)
    - `forum_votes`: The number of votes the user has made in the forum (`TEXT`)
    - `lastseen`: The timestamp of when the user was last seen (`TEXT`)
    - `datejoined`: The timestamp of when the user joined (`TEXT`)
    - `points_total`: The total number of points the user has (`TEXT`)
    - `points_day`: The number of points the user has earned today (`TEXT`)
    - `points_week`: The number of points the user has earned this week (`TEXT`)
    - `points_month`: The number of points the user has earned this month (`TEXT`)
    - `points_forum`: The number of points the user has earned in the forum (`TEXT`)
    - `points_purchase`: The number of points the user has earned through purchases (`TEXT`)
    - `points_other`: The number of points the user has earned through other means (`TEXT`)
    - `points_spent`: The number of points the user has spent (`TEXT`)
    - `points_decayed`: The number of points the user has lost due to decay (`TEXT`)
    - `tags`: The tags for the user (`JSON`)
    - `points_adjusted`: The adjusted number of points the user has (`TEXT`)

## Images

In progress.

## Debug

When `debug` is set to `true` in the config file, each request will be logged in `target/debug`. Requests are seperated by request type as documented in the Enjin API docs. The following endpoints logged:

- `Applications`
    - `getApplication`
    - `getList`
    - `getTypes`
- `Forum`
    - `getCategoriesAndForums`
    - `getForum`
    - `getThread`
- `News`
    - `getNews`
- `Site`
    - `getStats`
- `Tags`
    - `get`
- `Tickets`
    - `getModules`
    - `getReplies`
    - `getTickets`
- `User`
    - `login`
- `UserAdmin`
    - `get`
    - `getUserTags`