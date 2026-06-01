const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = (req.headers.authorization || '').toString();
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ===== POSTS/FEED =====

// Get feed posts
router.get('/feed', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const sort = req.query.sort || 'recent';
    
    let query = `
      SELECT 
        p.id, p.user_id, p.content, p.image_url,
        p.likes_count, p.comments_count, p.shares_count,
        p.created_at,
        u.first_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;

    if (sort === 'trending') {
      query += ` ORDER BY p.likes_count DESC, p.created_at DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    query += ` LIMIT $1 OFFSET $2`;

    console.log('Feed query:', { limit, offset, sort });
    const result = await pool.query(query, [limit, offset]);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Failed to fetch feed', details: err.message });
  }
});

// Create post
router.post('/posts', verifyToken, async (req, res) => {
  try {
    const { content, image_url } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const postId = uuidv4();
    
    // Try inserting with image_url, if it fails, insert without it
    try {
      await pool.query(
        `INSERT INTO posts (id, user_id, content, image_url) VALUES ($1, $2, $3, $4)`,
        [postId, req.user.sub, content, image_url || null]
      );
    } catch (colErr) {
      // Column doesn't exist, try without it
      if (colErr.message && colErr.message.includes('image_url')) {
        await pool.query(
          `INSERT INTO posts (id, user_id, content) VALUES ($1, $2, $3)`,
          [postId, req.user.sub, content]
        );
      } else {
        throw colErr;
      }
    }

    // Update user posts count (if column exists)
    try {
      await pool.query(
        `UPDATE users SET posts_count = posts_count + 1 WHERE id = $1`,
        [req.user.sub]
      );
    } catch (countErr) {
      // posts_count column doesn't exist, skip it
      if (!countErr.message || !countErr.message.includes('posts_count')) {
        throw countErr;
      }
    }

    res.status(201).json({ id: postId, message: 'Post created' });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to create post', details: err.message });
  }
});

// Get post details with comments
router.get('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const postResult = await pool.query(
      `SELECT p.*, u.first_name
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [postId]
    );

    if (!postResult.rows.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentsResult = await pool.query(
      `SELECT c.*, u.first_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at DESC`,
      [postId]
    );

    res.json({
      post: postResult.rows[0],
      comments: commentsResult.rows
    });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Delete post
router.delete('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const postResult = await pool.query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [postId]
    );

    if (!postResult.rows.length) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postResult.rows[0].user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);
    
    await pool.query(
      `UPDATE users SET posts_count = GREATEST(0, posts_count - 1) WHERE id = $1`,
      [req.user.sub]
    );

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ===== COMMENTS =====

// Add comment to post
router.post('/posts/:postId/comments', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const commentId = uuidv4();
    await pool.query(
      `INSERT INTO comments (id, post_id, user_id, content) VALUES ($1, $2, $3, $4)`,
      [commentId, postId, req.user.sub, content]
    );

    await pool.query(
      `UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1`,
      [postId]
    );

    res.status(201).json({ id: commentId, message: 'Comment added' });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete comment
router.delete('/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    const commentResult = await pool.query(
      `SELECT user_id, post_id FROM comments WHERE id = $1`,
      [commentId]
    );

    if (!commentResult.rows.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (commentResult.rows[0].user_id !== req.user.sub) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const postId = commentResult.rows[0].post_id;
    await pool.query(`DELETE FROM comments WHERE id = $1`, [commentId]);
    
    await pool.query(
      `UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = $1`,
      [postId]
    );

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ===== LIKES =====

// Toggle like on post/comment
router.post('/likes', verifyToken, async (req, res) => {
  try {
    const { post_id, comment_id } = req.body;
    if (!post_id && !comment_id) {
      return res.status(400).json({ error: 'post_id or comment_id required' });
    }

    const likeId = uuidv4();
    const table = post_id ? 'posts' : 'comments';
    const itemId = post_id || comment_id;

    // Check if already liked
    const existingLike = await pool.query(
      `SELECT id FROM likes WHERE user_id = $1 AND ${post_id ? 'post_id' : 'comment_id'} = $2`,
      [req.user.sub, itemId]
    );

    if (existingLike.rows.length) {
      // Unlike
      await pool.query(
        `DELETE FROM likes WHERE id = $1`,
        [existingLike.rows[0].id]
      );
      await pool.query(
        `UPDATE ${table} SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1`,
        [itemId]
      );
      res.json({ liked: false });
    } else {
      // Like
      await pool.query(
        `INSERT INTO likes (id, user_id, ${post_id ? 'post_id' : 'comment_id'}) VALUES ($1, $2, $3)`,
        [likeId, req.user.sub, itemId]
      );
      await pool.query(
        `UPDATE ${table} SET likes_count = likes_count + 1 WHERE id = $1`,
        [itemId]
      );
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// ===== COMMUNITIES =====

// Get all communities
router.get('/communities', verifyToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, sort = 'trending' } = req.query;

    let orderBy = 'is_trending DESC, created_at DESC';
    if (sort === 'members') orderBy = 'members_count DESC';
    if (sort === 'active') orderBy = 'posts_count DESC';

    const result = await pool.query(
      `SELECT * FROM communities ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get communities error:', err);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Get user's communities
router.get('/user/communities', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.* FROM communities c
       JOIN community_members cm ON c.id = cm.community_id
       WHERE cm.user_id = $1
       ORDER BY cm.joined_at DESC`,
      [req.user.sub]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get user communities error:', err);
    res.status(500).json({ error: 'Failed to fetch user communities' });
  }
});

// Create community
router.post('/communities', verifyToken, async (req, res) => {
  try {
    const { name, description, icon, is_private } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const communityId = uuidv4();
    await pool.query(
      `INSERT INTO communities (id, name, description, icon, creator_id, is_private)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [communityId, name, description || null, icon || null, req.user.sub, is_private || false]
    );

    // Add creator as member
    const memberId = uuidv4();
    await pool.query(
      `INSERT INTO community_members (id, community_id, user_id, role)
       VALUES ($1, $2, $3, 'creator')`,
      [memberId, communityId, req.user.sub]
    );

    res.status(201).json({ id: communityId, message: 'Community created' });
  } catch (err) {
    console.error('Create community error:', err);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// Join community
router.post('/communities/:communityId/join', verifyToken, async (req, res) => {
  try {
    const { communityId } = req.params;

    const existing = await pool.query(
      `SELECT id FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [communityId, req.user.sub]
    );

    if (existing.rows.length) {
      return res.status(400).json({ error: 'Already a member' });
    }

    const memberId = uuidv4();
    await pool.query(
      `INSERT INTO community_members (id, community_id, user_id)
       VALUES ($1, $2, $3)`,
      [memberId, communityId, req.user.sub]
    );

    await pool.query(
      `UPDATE communities SET members_count = members_count + 1 WHERE id = $1`,
      [communityId]
    );

    res.json({ message: 'Joined community' });
  } catch (err) {
    console.error('Join community error:', err);
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// Leave community
router.post('/communities/:communityId/leave', verifyToken, async (req, res) => {
  try {
    const { communityId } = req.params;

    await pool.query(
      `DELETE FROM community_members WHERE community_id = $1 AND user_id = $2`,
      [communityId, req.user.sub]
    );

    await pool.query(
      `UPDATE communities SET members_count = GREATEST(0, members_count - 1) WHERE id = $1`,
      [communityId]
    );

    res.json({ message: 'Left community' });
  } catch (err) {
    console.error('Leave community error:', err);
    res.status(500).json({ error: 'Failed to leave community' });
  }
});

// ===== USER RELATIONSHIPS =====

// Get user profile
router.get('/users/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await pool.query(
      `SELECT id, first_name, bio, location, website, 
              membership_tier, followers_count, following_count, posts_count, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = await pool.query(
      `SELECT id FROM user_relationships 
       WHERE follower_id = $1 AND following_id = $2 AND relationship_type = 'follow'`,
      [req.user.sub, userId]
    );

    res.json({
      ...userResult.rows[0],
      is_following: isFollowing.rows.length > 0
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/users/profile', verifyToken, async (req, res) => {
  try {
    const { first_name, bio, location, website, avatar } = req.body;

    await pool.query(
      `UPDATE users SET first_name = $1, bio = $2, location = $3, website = $4, avatar = $5, updated_at = now()
       WHERE id = $6`,
      [first_name, bio, location, website, avatar, req.user.sub]
    );

    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Follow user
router.post('/users/:userId/follow', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.sub) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existing = await pool.query(
      `SELECT id FROM user_relationships 
       WHERE follower_id = $1 AND following_id = $2 AND relationship_type = 'follow'`,
      [req.user.sub, userId]
    );

    if (existing.rows.length) {
      return res.status(400).json({ error: 'Already following' });
    }

    const relationshipId = uuidv4();
    await pool.query(
      `INSERT INTO user_relationships (id, follower_id, following_id, relationship_type)
       VALUES ($1, $2, $3, 'follow')`,
      [relationshipId, req.user.sub, userId]
    );

    await pool.query(
      `UPDATE users SET followers_count = followers_count + 1 WHERE id = $1`,
      [userId]
    );

    await pool.query(
      `UPDATE users SET following_count = following_count + 1 WHERE id = $1`,
      [req.user.sub]
    );

    res.json({ message: 'Following user' });
  } catch (err) {
    console.error('Follow user error:', err);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user
router.post('/users/:userId/unfollow', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query(
      `DELETE FROM user_relationships 
       WHERE follower_id = $1 AND following_id = $2 AND relationship_type = 'follow'`,
      [req.user.sub, userId]
    );

    await pool.query(
      `UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = $1`,
      [userId]
    );

    await pool.query(
      `UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = $1`,
      [req.user.sub]
    );

    res.json({ message: 'Unfollowing user' });
  } catch (err) {
    console.error('Unfollow user error:', err);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get user followers
router.get('/users/:userId/followers', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 20), 100);
    const offset = Math.max(0, parseInt(req.query.offset) || 0);

    const result = await pool.query(
      `SELECT u.id, u.first_name
       FROM users u
       JOIN user_relationships ur ON u.id = ur.follower_id
       WHERE ur.following_id = $1 AND ur.relationship_type = 'follow'
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get followers error:', err);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// ===== MESSAGES/CONVERSATIONS =====

// Get user conversations
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, 
              CASE WHEN c.participant_1_id = $1 THEN c.participant_2_id ELSE c.participant_1_id END as other_user_id,
              u.first_name,
              c.last_message_at
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.participant_1_id = $1 THEN c.participant_2_id ELSE c.participant_1_id END
       WHERE c.participant_1_id = $1 OR c.participant_2_id = $1
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [req.user.sub]
    );

    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get or create conversation
router.post('/conversations/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.sub) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const [participant1, participant2] = [req.user.sub, userId].sort();

    let result = await pool.query(
      `SELECT id FROM conversations 
       WHERE participant_1_id = $1 AND participant_2_id = $2`,
      [participant1, participant2]
    );

    if (result.rows.length) {
      return res.json({ conversation_id: result.rows[0].id });
    }

    const conversationId = uuidv4();
    await pool.query(
      `INSERT INTO conversations (id, participant_1_id, participant_2_id)
       VALUES ($1, $2, $3)`,
      [conversationId, participant1, participant2]
    );

    res.status(201).json({ conversation_id: conversationId });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages in conversation
router.get('/conversations/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 200);
    const offset = Math.max(0, parseInt(req.query.offset) || 0);

    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
              u.first_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );

    res.json({ data: result.rows.reverse() });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/conversations/:conversationId/messages', verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const messageId = uuidv4();
    await pool.query(
      `INSERT INTO messages (id, conversation_id, sender_id, content)
       VALUES ($1, $2, $3, $4)`,
      [messageId, conversationId, req.user.sub, content]
    );

    await pool.query(
      `UPDATE conversations SET last_message_at = now() WHERE id = $1`,
      [conversationId]
    );

    res.status(201).json({ id: messageId, message: 'Message sent' });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
