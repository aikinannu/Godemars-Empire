const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER || 'gdwb_user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'gdwb_app',
  max: 10,
});

// Ensure all tables exist and export a ready promise
const ready = (async () => {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        email_verified_at TIMESTAMPTZ,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        avatar TEXT,
        bio TEXT,
        location TEXT,
        website TEXT,
        membership_tier TEXT DEFAULT 'free',
        followers_count INT DEFAULT 0,
        following_count INT DEFAULT 0,
        posts_count INT DEFAULT 0,
        tenant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Users table ensured');

    // Refresh tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Refresh tokens table ensured');

    // Posts/Feed table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url TEXT,
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
    `);
    console.log('Posts table ensured');

    // Comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
    `);
    console.log('Comments table ensured');

    // Likes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
        comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (user_id, post_id, comment_id)
      );
    `);
    console.log('Likes table ensured');

    // Communities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS communities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        members_count INT DEFAULT 0,
        posts_count INT DEFAULT 0,
        is_private BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        is_trending BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at);
      CREATE INDEX IF NOT EXISTS idx_communities_trending ON communities(is_trending);
    `);
    console.log('Communities table ensured');

    // Community members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_members (
        id TEXT PRIMARY KEY,
        community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (community_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
      CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
    `);
    console.log('Community members table ensured');

    // Conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        participant_1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participant_2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_message_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (participant_1_id, participant_2_id)
      );
    `);
    console.log('Conversations table ensured');

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    `);
    console.log('Messages table ensured');

    // User relationships table (follows)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_relationships (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        relationship_type TEXT DEFAULT 'follow',
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (follower_id, following_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_relationships_follower_id ON user_relationships(follower_id);
      CREATE INDEX IF NOT EXISTS idx_user_relationships_following_id ON user_relationships(following_id);
    `);
    console.log('User relationships table ensured');

    // User likes/favorites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
        product_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (user_id, post_id, product_id)
      );
    `);
    console.log('User favorites table ensured');

    // Phase-2 tables: email verification, 2FA, backup codes, oauth profiles, login activity, security events
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        email TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        verified_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON email_verification_tokens(expires_at);
    `);
    console.log('Email verification tokens table ensured');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS two_factor_settings (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        authenticator_secret TEXT,
        enabled BOOLEAN DEFAULT false,
        method TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Two-factor settings table ensured');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS backup_codes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);
    `);
    console.log('Backup codes table ensured');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS oauth_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        profile JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_provider_user ON oauth_profiles(provider, provider_id);
    `);
    console.log('OAuth profiles table ensured');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_activity (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip_address TEXT,
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON login_activity(user_id);
    `);
    console.log('Login activity table ensured');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
    `);
    console.log('Security events table ensured');

    console.log('All social feature tables ensured');
  } catch (err) {
    console.error('Error ensuring tables:', err);
  }
})();

module.exports = { pool, ready };
