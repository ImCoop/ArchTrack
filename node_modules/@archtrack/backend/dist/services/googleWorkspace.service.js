import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';
const assertGoogleConfigured = () => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new HttpError(503, 'Google OAuth is not configured.');
    }
};
const buildMultipartBody = (metadata, bytes, mimeType, boundary) => Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
]);
export const googleWorkspaceService = {
    async refreshAccessToken(refreshToken) {
        assertGoogleConfigured();
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }),
        });
        if (!response.ok) {
            throw new Error('Google access token refresh failed.');
        }
        return (await response.json());
    },
    async createDriveFolder(input) {
        const tokens = await this.refreshAccessToken(input.refreshToken);
        const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: input.name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: input.parentFolderId ? [input.parentFolderId] : undefined,
            }),
        });
        if (!response.ok) {
            throw new Error('Drive folder creation failed.');
        }
        return (await response.json());
    },
    async getDriveFile(input) {
        const tokens = await this.refreshAccessToken(input.refreshToken);
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.fileId)}?fields=id,name,webViewLink,mimeType`, {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });
        if (!response.ok) {
            throw new Error('Drive folder lookup failed.');
        }
        return (await response.json());
    },
    async uploadDriveFile(input) {
        const tokens = await this.refreshAccessToken(input.refreshToken);
        const boundary = `archtrack-${Date.now().toString(36)}`;
        const body = buildMultipartBody({
            name: input.fileName,
            parents: [input.parentFolderId],
        }, input.bytes, input.mimeType, boundary);
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body,
        });
        if (!response.ok) {
            throw new Error('Drive file upload failed.');
        }
        return (await response.json());
    },
    async sendGmailMessage(input) {
        const tokens = await this.refreshAccessToken(input.refreshToken);
        const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: input.raw }),
        });
        if (!response.ok) {
            throw new Error('Gmail send failed.');
        }
    },
};
