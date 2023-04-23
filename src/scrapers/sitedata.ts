import * as cheerio from 'cheerio';
import * as esprima from 'esprima';
import escodegen from 'escodegen';
import { SiteAuth } from '../interfaces/generic';
import { getRequest } from '../util/request';
import { Database } from 'sqlite3';
import { safeEval } from '../util/files';
import { ModuleCategoriesDB, ModulesDB, PagesDB, PresetsDB, SiteData } from '../interfaces/sitedata';
import { insertRow, insertRows } from '../util/database';
import { MessageType, statusMessage } from '../util/console';

async function fetchSiteDataObject(domain: string, siteAuth: SiteAuth): Promise<SiteData | null> {
    const siteResponse = await getRequest(domain, `/admin/modules/index`, {
        Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`
    }, '/fetchSiteDataObject');

    const $ = cheerio.load(siteResponse.data);

    const scriptNode = $('script[type="text/javascript"]').toArray().find((element) => {
        return $(element).html()?.includes('window.modules_init_data');
    });

    if (scriptNode) {
        const scriptContent = $(scriptNode).contents().text();
        const scriptAst = esprima.parseScript(scriptContent);

        let siteObject;

        for (const node of scriptAst.body) {
            if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
                const assignmentExpr = node.expression;
                if (
                    assignmentExpr.left.type === 'MemberExpression' &&
                    assignmentExpr.left.object.type === 'Identifier' &&
                    assignmentExpr.left.object.name === 'window' &&
                    assignmentExpr.left.property.type === 'Identifier' &&
                    assignmentExpr.left.property.name === 'modules_init_data'
                ) {
                    siteObject = assignmentExpr.right;
                    break;
                }
            }
        }

        const siteData: SiteData = siteObject ? safeEval(escodegen.generate(siteObject)) : {};

        statusMessage(MessageType.Process, 'Site data object fetched')
        return siteData;
    }

    statusMessage(MessageType.Error, 'Could not find site data object.');
    return null;
}

export async function getSiteData(domain: string, siteAuth: SiteAuth, database: Database, siteID: string) {
    const siteData = await fetchSiteDataObject(domain, siteAuth);

    if (siteData) {
        const moduleCategoryDB: ModuleCategoriesDB[] = [];
        const moduleDB: ModulesDB[] = [];
        const presetDB: PresetsDB[] = [];

        for (const category of siteData.categories_and_modules) {
            moduleCategoryDB.push([
                category.category_id,
                category.title,
                category.order,
                category.platform,
                category.webpush_title ? category.webpush_title : null,
                category.regular_title
            ]);
            for (const module of category.modules) {
                moduleDB.push([
                    module.rid,
                    module.category_id,
                    module.module_id,
                    module.title,
                    module.description,
                    module.image,
                    module.order,
                    module.platform,
                    module.webpush_title ? module.webpush_title : null,
                    module.listed,
                    module.allow_create,
                    module.module_type,
                    module.help_guide_url,
                    module.notes,
                    module.min_width,
                    module.video_html,
                    module.released
                ]);
                for (const preset of module.presets) {
                    presetDB.push([
                        preset.modulepreset_id,
                        preset.category_id,
                        preset.name,
                        preset.admin_access,
                        preset.admin_access_tags ? preset.admin_access_tags : null,
                        preset.disabled,
                        module.module_id,
                        module.module_type
                    ]);
                }
            }
        }

        await insertRows(database, 'module_categories', moduleCategoryDB);
        await insertRows(database, 'modules', moduleDB);
        await insertRows(database, 'presets', presetDB);

        const pageDB: PagesDB[] = [];

        for (const pages of Object.values(siteData.presets_pages)) {
            for (const page of pages) {
                pageDB.push([
                    page.site_id,
                    page.url,
                    page.page_id,
                    page.pagename,
                    page.section_id,
                    page.section_type,
                    page.section_width,
                    page.section_type2,
                    page.section_name,
                    page.container_id,
                    page.container_title,
                    page.container_footer ? page.container_footer : null,
                    page.container_footer_url,
                    page.container_footer_window,
                    page.container_position,
                    page.container_graphics,
                    page.rows,
                    page.columns,
                    page.acl_access,
                    page.collapsible_container,
                    page.start_collapsed,
                    page.rid,
                    page.preset_id,
                    page.row,
                    page.column,
                    page.module_width,
                    page.module_name,
                    page.disabled,
                    page.module_type,
                ]);
            }
        }

        await insertRows(database, 'pages', pageDB);

        await insertRow(database, 'site_data', 
            siteID,
            JSON.stringify(siteData.sites_games),
            JSON.stringify(siteData.plan),
            JSON.stringify(siteData.licenses),
        )

        statusMessage(MessageType.Completion, 'Site data successfully inserted into database.');
    }
}