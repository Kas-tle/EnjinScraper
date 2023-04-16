export interface SiteData {
    categories_and_modules: CategoriesAndModules.Category[];
    presets_pages: {
        [key: string]: Preset[];
    };
    sites_games: Games;
    plan: Plan;
    recycle_bin: string[];
    licenses: Licenses;
    is_owner: boolean;
    access: Access;
}

export namespace CategoriesAndModules {
    export interface Category {
        category_id: string;
        title: string;
        order: string;
        platform: string;
        webpush_title: string | null;
        modules: Module[];
        regular_title: string;
    }
    export interface Module {
        rid: string;
        category_id: string;
        module_id: string;
        title: string;
        description: string;
        image: string;
        order: string;
        platform: string;
        webpush_title: string | null;
        listed: string;
        allow_create: string;
        module_type: string;
        presets: Preset[];
        help_guide_url: string;
        notes: string;
        min_width: string;
        video_html: string;
        released: string;
    }
    export interface Preset {
        category_id: string;
        modulepreset_id: string;
        name: string;
        admin_access: string;
        admin_access_tags: string | null;
        disabled: boolean;
    }
}

export interface Preset {
    site_id: string;
    url: string;
    page_id: string;
    pagename: string;
    section_id: string;
    section_type: string;
    section_width: string;
    section_type2: string;
    section_name: string;
    container_id: string;
    container_title: string;
    container_footer: null | string;
    container_footer_url: string;
    container_footer_window: string;
    container_position: string;
    container_graphics: string;
    rows: string;
    columns: string;
    acl_access: string;
    collapsible_container: string;
    start_collapsed: string;
    rid: string;
    preset_id: string;
    row: string;
    column: string;
    module_width: string;
    module_name: string;
    disabled: string;
    module_type: string;
}

export interface Games {
    [key: string]: string;
}

export interface Plan {
    site_id: string;
    user_id: string;
    name: string;
    type_id: string;
    plan_id: string;
    domain: string;
    domain_type: string;
    parent_domain: string;
    created: string;
    status: string;
    special_mode: string;
    unbranded: string;
    custom_footer: string;
    favicon: string;
    browsertitle: string;
    theme_id: string;
    style_id: string;
    time_expire: string;
    time_delete: string;
    prospective_plan_id: string;
    status_extended: string;
    subscription_id: null | string;
    timezone: string;
    hide_ipaddress: string;
    layout_format: string;
    welcome_message: string;
    logo: string;
    logo_member: string;
    wowhead: string;
    aionarmory: string;
    ffxiv_yg: string;
    ffxiv_archives: string;
    swtor_torhead: string;
    registration_mode: string;
    registration_preset_id: null | string;
    country: string;
    special_plan_setting: string;
    trial_started: string;
    last_pm_email: string;
    enable_characters: string;
    homepage: string;
    systempage: string;
    title_format: string;
    like_button: string;
    plus1_button: string;
    twitter_button: string;
    twitter_follow: string;
    site_like_button: string;
    site_info_link: string;
    mumble_icon: string;
    site_usernames: string;
    wow_character_colors: string;
    aion_character_colors: string;
    ffxiv_character_colors: string;
    rift_character_colors: string;
    ownership_transfer_code: null | string;
    ownership_transfer_user: null | string;
    bbcode_lastedited: string;
    promo_ad: string;
    access_denied_page: string;
    api_mode: string;
    sitewall_access: string;
    comments_disabled: string;
    timeformat: string;
    google_analytics_id: string;
    restrict_wall_comments: string;
    rank: string;
    dnsme_domain_id: string;
    domain_checked: string;
    domain_nameservers: string;
    meta_description: string;
    mobile_enabled: string;
    language: string;
    show_points_in_forum: string;
    show_points_in_profile: string;
    points_name: null | string;
    points_decay: string;
    points_decay_no_negative: string;
    send_points: string;
    warnings_limit: null | string;
    punishments_limit: null | string;
    meta_keywords: string;
    meta_robots: string;
    sitemap: null | string;
    sitemap_time: null | string;
    message_options: string;
    email_options: string;
    password_text: string;
    password_field: string;
    header_code: string;
    footer_code: string;
    page404: null | string;
    analytics_email: null | string;
    analytics_key: null | string;
    analytics_profile_id: string;
    analytics_dimension_id: string;
    analytics_client_id: null | string;
    smiley_pack_id: string;
    show_empty_notification_state: string;
    platform: string;
    title: string;
    price: string;
    allowed_pages: string;
    allowed_modules: string;
    allowed_storage: string;
    allowed_bandwidth: string;
    allowed_tag_automations: string;
    advertising: string;
    voice_slots: string;
    minecraft_servers: string;
    forum_notices: string;
    ts3_slots: string;
    mumble_slots: string;
    warnings: string;
    punishments: string;
    allowed_tags: string;
    bungee_servers: string;
    twitch_streamers: string;
}

export interface Licenses {
    html: string;
    verticalmenu: string;
    horizontalmenu: string;
    login: string;
    youtube: string;
    header: string;
    news: string;
    digitalclock: string;
    memberslatest: string;
    membersonline: string;
    shoutbox: string;
    forum: string;
    forumlatestthreads: string;
    matches: string;
    matchesupcoming: string;
    matcheslatest: string;
    paypaldonations: string;
    newslatest: string;
    forumtopposter: string;
    listitems: string;
    userspotlight: string;
    rssfeed: string;
    imageupload: string;
    birthday: string;
    aionsearch: string;
    gameserverstatus: string;
    recruitmentstatus: string;
    eventcalendar: string;
    eventsmini: string;
    eventsupcoming: string;
    gallery: string;
    galleryslideshow: string;
    applicationform: string;
    generalform: string;
    lastseen: string;
    achievements: string;
    chat: string;
    hitcounter: string;
    grouppay: string;
    progression: string;
    countdown: string;
    ventrilo: string;
    teamspeak: string;
    showcase: string;
    mumble: string;
    wowprogress: string;
    wowguildlevel: string;
    poll: string;
    websitegames: string;
    dkp: string;
    newsarchive: string;
    newstags: string;
    recruitmentlist: string;
    riftguildperks: string;
    forumtopuser: string;
    claim: string;
    comments: string;
    wowguildtabard: string;
    swtorrecruitmentstatus: string;
    shopping: string;
    latestpurchases: string;
    twitterfeed: string;
    torheadsearch: string;
    sitewall: string;
    gw2recruitmentstatus: string;
    terarecruitmentstatus: string;
    minecraftserverstatus: string;
    minecraftserverplayersonline: string;
    minecraftservertopplayersonline: string;
    minecraftserverplayersgraph: string;
    minecraftserverresponsegraph: string;
    shopactivity: string;
    recentstatus: string;
    messagingchat: string;
    minecraftvoting: string;
    minecraftservertpsgraph: string;
    members: string;
    shoppingfeatured: string;
    ts3grouppay: string;
    pointsdisplay: string;
    topdonator: string;
    donationgoal: string;
    toppointlist: string;
    toppointuser: string;
    textslider: string;
    websitestats: string;
    horizontalmenu2: string;
    stretchgoal: string;
    awarddisplay: string;
    forumlatestnewthreads: string;
    mumblegrouppay: string;
    tickets: string;
    wiki: string;
    wikitopeditors: string;
    wikirecentpages: string;
    wikistats: string;
    bladesoulrecruitmentstatus: string;
}

export interface Access {
    full_access: boolean;
    full_user_management: boolean;
    view_and_search_users: boolean;
    view_and_search_users_and_ips: boolean;
    edit_avatar_username_signatures: boolean;
    user_ban_management: boolean;
    user_ban_and_ip_ban_management: boolean;
    manage_user_reg_settings: boolean;
    view_site_logs: boolean;
    view_forum_logs: boolean;
    full_tag_management: boolean;
    only_tag_and_untag_users: boolean;
    create_order_edit_user_tags_cat: boolean;
    full_automation_and_point_mngr: boolean;
    create_edit_delete_automations: boolean;
    point_management_and_settings: boolean;
    view_points_log: boolean;
    full_warning_management: boolean;
    full_punishment_management: boolean;
    view_warning_log_warned_users: boolean;
    view_punishment_log_punished_usr: boolean;
    create_edit_delete_warning_types: boolean;
    create_edit_del_punishment_types: boolean;
    full_module_management_and_edit: boolean;
    full_page_management: boolean;
    create_and_manage_website_themes: boolean;
    manage_voice_server: boolean;
    full_file_management: boolean;
    game_team_recruitment_management: boolean;
    game_management_only: boolean;
    team_management_only: boolean;
    recruitment_management_only: boolean;
    announcements_full_management: boolean;
    smiley_manager_full_management: boolean;
}

type ModuleCategoriesTuple = [
    string, string, string, string|null, string
]
export interface ModuleCategoriesDB extends Array<ModuleCategoriesTuple[number]> {}

type ModulesTuple = [
    string, string, string, string, string, string, string, string, string|null, string,
    string, string, string, string, string, string, string
]
export interface ModulesDB extends Array<ModulesTuple[number]> {}

type PresetsTuple = [
    string, string, string, string, string|null, boolean, string, string
]
export interface PresetsDB extends Array<PresetsTuple[number]> {}

type PagesTuple = [
    string, string, string, string, string, string, string, string, string, string,
    string, string|null, string, string, string, string, string, string, string, string,
    string, string, string, string, string, string, string, string, string
]
export interface PagesDB extends Array<PagesTuple[number]> {}

type SiteDataTuple = [
    string, string, string, string
]
export interface SiteDataDB extends Array<SiteDataTuple[number]> {}