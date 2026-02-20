import { query } from "../config/db.js";

export const getUserByOpenId = async (openid) => {
  if (!openid) {
    return null;
  }

  const sql = 'SELECT id, username, email, open_id FROM users WHERE open_id = ? LIMIT 1';
  const values = [openid];

  const [results] = await query(sql, values);
  if (results.length === 0) {
    return null;
  }

  return results[0];
};

export const createUserByOpenId = async (openid, userInfo = {}) => {
  const { nickname = '', avatarUrl = '' } = userInfo;

  const sql = `INSERT INTO users (open_id, nickname, avatar_url) VALUES (?, ?, ?)`;
  const [result] = await query(sql, [openid, nickname, avatarUrl]);
  return result.insertId;
};
