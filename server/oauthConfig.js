// OAuth configuration for social authentication providers
// Supports: Google, GitHub, Microsoft, Facebook

const oauthConfigs = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/auth/google/callback`,
    scope: ["profile", "email"],
  },
  github: {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/auth/github/callback`,
    scope: ["user:email"],
  },
  microsoft: {
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/auth/microsoft/callback`,
    scope: ["user.read", "mail.read"],
    tenant: process.env.MICROSOFT_TENANT_ID || "common",
  },
  facebook: {
    appID: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${process.env.API_URL}/auth/facebook/callback`,
    scope: ["public_profile", "email"],
  },
};

// OAuth profile mapping
const profileMappers = {
  google: (profile) => ({
    provider: "google",
    id: profile.id,
    email: profile.emails[0]?.value,
    name: profile.displayName,
    picture: profile.photos[0]?.value,
    verified: true,
  }),

  github: (profile) => ({
    provider: "github",
    id: profile.id,
    email: profile.emails[0]?.value || profile.username + "@github.com",
    name: profile.displayName,
    username: profile.username,
    picture: profile.photos[0]?.value,
    verified: !!profile.emails[0]?.verified,
  }),

  microsoft: (profile) => ({
    provider: "microsoft",
    id: profile.id,
    email: profile.emails[0]?.value,
    name: profile.displayName,
    picture: profile.photos[0]?.value,
    verified: true,
  }),

  facebook: (profile) => ({
    provider: "facebook",
    id: profile.id,
    email: profile.emails[0]?.value,
    name: profile.displayName,
    picture: profile.photos[0]?.value,
    verified: false, // Facebook doesn't provide verification status
  }),
};

module.exports = {
  oauthConfigs,
  profileMappers,
};
