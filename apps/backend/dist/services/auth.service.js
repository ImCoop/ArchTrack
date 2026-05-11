import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { HttpError } from '../utils/http-error.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createAccessToken, createOpaqueRefreshToken, hashToken } from '../utils/tokens.js';
const toPublicUser = (user) => {
    const { passwordHash, googleRefreshToken, ...publicUser } = user;
    void passwordHash;
    void googleRefreshToken;
    return publicUser;
};
const toAuthenticatedUser = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
});
const refreshExpiryDate = () => {
    const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhm])$/);
    if (!match) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multiplier = unit === 'd' ? 24 * 60 * 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 60 * 1000;
    return new Date(Date.now() + amount * multiplier);
};
const issueTokenPair = async (user) => {
    const refreshToken = createOpaqueRefreshToken();
    const refreshTokenRecord = await userRepository.createRefreshToken({
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiryDate().toISOString(),
    });
    return {
        accessToken: createAccessToken(toAuthenticatedUser(user)),
        refreshToken,
        refreshTokenId: refreshTokenRecord.id,
    };
};
const googleScopes = ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.send'];
const assertGoogleConfigured = () => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new HttpError(503, 'Google OAuth is not configured.');
    }
};
const fetchGoogleTokens = async (code) => {
    assertGoogleConfigured();
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        }),
    });
    if (!response.ok) {
        throw new HttpError(401, 'Google OAuth token exchange failed.');
    }
    return (await response.json());
};
const fetchGoogleUserInfo = async (accessToken) => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        throw new HttpError(401, 'Google profile lookup failed.');
    }
    return (await response.json());
};
export const authService = {
    async register(input) {
        const existingUser = await userRepository.findByEmail(input.email);
        if (existingUser) {
            throw new HttpError(409, 'A user with this email already exists.');
        }
        const user = await userRepository.create({
            email: input.email,
            passwordHash: await hashPassword(input.password),
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role,
            departmentId: input.departmentId,
        });
        const tokens = await issueTokenPair(user);
        return {
            user: toPublicUser(user),
            ...tokens,
        };
    },
    async login(input) {
        const user = await userRepository.findByEmail(input.email);
        if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
            throw new HttpError(401, 'Invalid email or password.');
        }
        const tokens = await issueTokenPair(user);
        return {
            user: toPublicUser(user),
            ...tokens,
        };
    },
    getGoogleAuthUrl() {
        assertGoogleConfigured();
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
        url.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', googleScopes.join(' '));
        url.searchParams.set('access_type', 'offline');
        url.searchParams.set('prompt', 'consent');
        return url.toString();
    },
    async loginWithGoogleCode(code) {
        const tokens = await fetchGoogleTokens(code);
        const profile = await fetchGoogleUserInfo(tokens.access_token);
        const email = profile.email.toLowerCase();
        const existingByGoogleId = await userRepository.findByGoogleId(profile.sub);
        const existingByEmail = await userRepository.findByEmail(email);
        let user = existingByGoogleId ?? existingByEmail;
        if (user) {
            user =
                (await userRepository.update(user.id, {
                    googleId: profile.sub,
                    googleRefreshToken: tokens.refresh_token ?? user.googleRefreshToken,
                })) ?? user;
        }
        else {
            user = await userRepository.create({
                email,
                passwordHash: await hashPassword(createOpaqueRefreshToken()),
                firstName: profile.given_name ?? 'Google',
                lastName: profile.family_name ?? 'User',
                role: 'viewer',
                googleId: profile.sub,
                googleRefreshToken: tokens.refresh_token,
            });
        }
        const tokenPair = await issueTokenPair(user);
        return {
            user: toPublicUser(user),
            ...tokenPair,
        };
    },
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new HttpError(401, 'Refresh token required.');
        }
        const refreshTokenRecord = await userRepository.findRefreshTokenByHash(hashToken(refreshToken));
        if (!refreshTokenRecord || refreshTokenRecord.revokedAt) {
            throw new HttpError(401, 'Invalid refresh token.');
        }
        if (new Date(refreshTokenRecord.expiresAt).getTime() <= Date.now()) {
            await userRepository.revokeRefreshToken(refreshTokenRecord.id);
            throw new HttpError(401, 'Refresh token expired.');
        }
        const user = await userRepository.findById(refreshTokenRecord.userId);
        if (!user) {
            throw new HttpError(401, 'User no longer exists.');
        }
        const tokens = await issueTokenPair(user);
        await userRepository.revokeRefreshToken(refreshTokenRecord.id, tokens.refreshTokenId);
        return {
            user: toPublicUser(user),
            ...tokens,
        };
    },
    async logout(refreshToken) {
        if (!refreshToken) {
            return;
        }
        const refreshTokenRecord = await userRepository.findRefreshTokenByHash(hashToken(refreshToken));
        if (refreshTokenRecord) {
            await userRepository.revokeRefreshToken(refreshTokenRecord.id);
        }
    },
    async getCurrentUser(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new HttpError(401, 'User no longer exists.');
        }
        return toPublicUser(user);
    },
};
