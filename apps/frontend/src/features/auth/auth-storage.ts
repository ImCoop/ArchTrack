const accessTokenKey = 'archtrack.accessToken';

export const authStorage = {
  getAccessToken() {
    return window.localStorage.getItem(accessTokenKey);
  },

  setAccessToken(token: string) {
    window.localStorage.setItem(accessTokenKey, token);
  },

  clearAccessToken() {
    window.localStorage.removeItem(accessTokenKey);
  },
};
