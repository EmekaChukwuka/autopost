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
    return rows[0];
  }
}

export default User;