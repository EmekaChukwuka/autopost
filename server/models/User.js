import pool from '../config/db.js';
import bcrypt from 'bcrypt';

class User {
  static async create({ name, email, password, provider}) {
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, provider) 
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, provider]
    );
    return { id: result.insertId, name, email, provider};
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar, provider, verified FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0];
  }

  static async comparePassword(email, candidatePassword) {
    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (!rows[0]) return false;
    return await bcrypt.compare(candidatePassword, rows[0].password);
  }

  static async uploadPost({ id, postDetailsDate, postDetailsPost, postDetailsPlatform}) {
    const [result] = await pool.execute(
      `INSERT INTO posts (user_id, post, platform, date) 
       VALUES (?, ?, ?, ?)`,
      [id, postDetailsPost, postDetailsPlatform, postDetailsDate ]
    );
    return { id, postDetailsPost, postDetailsPlatform, postDetailsDate };
  }

  static async getPosts(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM posts WHERE user_id = ? ',
      [id]
    );
    return rows;
  }

  
  // Get user's current subscription
  static async getUserSubscription(userId) {
    const [rows] = await pool.execute(
      `SELECT u.*, sp.name as plan_name, sp.social_accounts_limit, 
              sp.monthly_posts_limit, sp.ai_content_access, sp.analytics_access,
              sp.team_members_limit, sp.priority_support
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.id = ?`,
      [userId]
    );
    
    return rows[0];
  }

  // Activate subscription after payment
  static async activateSubscription(userId, planId, transactionId = null) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get plan details
      const [planRows] = await connection.execute(
        'SELECT * FROM subscription_plans WHERE id = ?',
        [planId]
      );
      
      if (planRows.length === 0) {
        throw new Error('Plan not found');
      }

      const plan = planRows[0];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30 * 24 * 60 * 60 * 1000); // Assuming monthly plans

      // Get current subscription for history
      const [currentSub] = await connection.execute(
        'SELECT subscription_plan_id FROM users WHERE id = ?',
        [userId]
      );

      const oldPlanId = currentSub[0]?.subscription_plan_id;

      // Update user subscription
      await connection.execute(
        `UPDATE users SET 
         subscription_plan_id = ?,
         subscription_status = 'active',
         subscription_start_date = ?,
         subscription_end_date = ?,
         auto_renew = TRUE,
         canceled_at = NULL
         WHERE id = ?`,
        [planId, startDate, endDate, userId]
      );

      // Add to subscription history
      await connection.execute(
        `INSERT INTO subscription_history 
         (user_id, plan_id, transaction_id, action, old_plan_id, new_plan_id, 
          amount_paid, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          planId,
          transactionId,
          oldPlanId ? 'renewed' : 'created',
          oldPlanId,
          planId,
          plan.price,
          startDate,
          endDate
        ]
      );

      await connection.commit();
      
      return {
        plan: plan.name,
        start_date: startDate,
        end_date: endDate,
        status: 'active'
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
}

export default User;