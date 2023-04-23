import { Database } from 'sqlite3';
import { SiteAuth } from '../interfaces/generic';
import { getRequest } from '../util/request';
import { CommentResponse, CommentsDB, Comment } from '../interfaces/comments';
import { insertRows } from '../util/database';
import { fileExists, parseJsonFile } from '../util/files';
import { addExitListeners, removeExitListeners } from '../util/exit';
import { MessageType, statusMessage } from '../util/console';

export async function getComments(database: Database, domain: string, siteAuth: SiteAuth) {
    let commentCids: string[] = [];
    
    commentCids.push(...await getColumnCommentCids(database, 'news_articles'));
    commentCids.push(...await getColumnCommentCids(database, 'application_responses'));
    commentCids.push(...await getColumnCommentCids(database, 'application_responses', 'admin_comment_cid'));
    commentCids.push(...await getColumnCommentCids(database, 'wiki_pages'));
    commentCids.push(...await getColumnCommentCids(database, 'gallery_images'));

    statusMessage(MessageType.Info, `Found ${commentCids.length} comments to scrape`)

    if (commentCids.length === 0) {
        statusMessage(MessageType.Critical, 'No comments to scrape');
        return;
    }

    let totalCommentCids = commentCids.length;
    let commentCidsCount = [0];

    if (fileExists('./target/recovery/comments.json')) {
        const progress = parseJsonFile('./target/recovery/comments.json') as [string[], number[]];
        commentCids = progress[0];
        totalCommentCids = commentCids.length;
        commentCidsCount[0] = progress[1][0];
    }

    addExitListeners(['./target/recovery/comments.json'], [[commentCids, commentCidsCount]]);

    for (let i = commentCidsCount[0]; i < totalCommentCids; i++) {
        const commentResponse = await getRequest(domain, `/ajax.php?s=comments&op=load&start=0&comment_cid=${commentCids[i]}&pageSize=-1&subPageSize=-1`, {
            Cookie: `${siteAuth.phpSessID}; ${siteAuth.csrfToken}`,
        }, '/getComments');
        const response: CommentResponse = commentResponse.data;

        const commentsDB: CommentsDB[] = [];
        flattenComments(response.comments, commentsDB);
        if (commentsDB.length > 0) {
            await insertRows(database, 'comments', commentsDB);
            statusMessage(MessageType.Process, `Found ${response.total} comments for comment cid ${commentCids[i]} [(${++commentCidsCount[0]}/${totalCommentCids})]`);
        } else {
            statusMessage(MessageType.Process, `Found 0 comments for comment cid ${commentCids[i]} [(${++commentCidsCount[0]}/${totalCommentCids})]`);
        }
    }

    removeExitListeners();
}

function flattenComments(comments: Comment[], commentsDB: CommentsDB[]) {
    for (const comment of comments) {
        commentsDB.push(
            [
                comment.comment_cid,
                comment.comment_id,
                comment.user_id,
                comment.guest_ip,
                comment.guest_name,
                comment.timestamp,
                comment.content,
                comment.status,
                comment.category,
                comment.parent_comment_id,
                JSON.stringify(comment.likes_user_ids),
                JSON.stringify(comment.likes),
                comment.likes_users,
                comment.likes_users_full,
                comment.ajax_like,
                comment.can_delete,
                comment.can_reply,
                comment.avatar,
                comment.username,
                comment.time,
                comment.can_like,
                comment.like_text,
                comment.tag_post_color,
            ]
        );

        if (comment.comments && comment.comments.comments.length > 0) {
            flattenComments(comment.comments.comments, commentsDB);
        }
    }
}

async function getColumnCommentCids(database: Database, table: string, column='comment_cid'): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const query = `SELECT ${column} FROM ${table} WHERE ${column} IS NOT NULL`;
        database.all(query, (err, rows: { [key: string]: string; }[]) => {
            if (err) {
                reject(err);
            } else {
                const commentCids = rows.map(row => row[column]);
                resolve(commentCids);
            }
        });
    });
}