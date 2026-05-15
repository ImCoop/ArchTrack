# ArchTrack Setup

## Environment File

Create a local `.env` in the project root from `.env.example`, then fill in the values below. Do not commit `.env`.

```env
API_ORIGIN=http://localhost:4000
INSTANT_APP_ID=
INSTANT_APP_ADMIN_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/google/callback
GOOGLE_DRIVE_PARENT_FOLDER_ID=
```

## InstantDB

1. Sign in or create an account at `https://instantdb.com/dash`.
2. Create an app for ArchTrack.
3. Copy the app ID into `INSTANT_APP_ID`.
4. Copy the app admin token into `INSTANT_APP_ADMIN_TOKEN`.
5. Push the schema and permissions:

```bash
npm run instant:login
npm run instant:push:schema
npm run instant:push:perms
```

The schema push opens a confirmation screen in the terminal. Choose `Push` to apply the listed changes.

The schema lives in `instant.schema.ts`. Permissions live in `instant.perms.ts` and are locked down so browser-side writes cannot create or mutate data unexpectedly. The current backend initializes the Instant Admin SDK through `apps/backend/src/config/instant.ts`; repository migration can now happen module by module.

## Google OAuth

1. Open `https://console.cloud.google.com/apis/credentials`.
2. Create or select a Google Cloud project.
3. Configure the OAuth consent screen.
4. Add test users while the app is in testing mode.
5. Enable the Gmail API and Google Drive API if you want ArchTrack notification emails and project Drive folders.
6. Create an OAuth Client ID with application type `Web application`.
7. Add this authorized JavaScript origin:

```text
http://localhost:5173
```

8. Add this authorized redirect URI exactly:

```text
http://localhost:5173/oauth/google/callback
```

9. Copy the client ID and client secret into `.env`.

The backend requests `openid`, `email`, `profile`, Gmail send, and Drive file access. The redirect URI in Google Cloud must exactly match `GOOGLE_REDIRECT_URI`.
If a user linked Google before Drive support was added, they should sign in with Google again so the refreshed token includes the Drive scope.

## Check Configuration

Start the app and open:

```text
http://localhost:4000/api/v1/setup/status
```

The response shows whether InstantDB and Google OAuth values are present without exposing secret values.
