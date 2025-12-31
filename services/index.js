import { query } from "../config/db.js";

export const getUserByOpenId = async (openid) => {
  if (!openid) {
    return null;
  }

  const sql = 'SELECT id, username, email, open_id FROM users WHERE open_id = ? LIMIT 1';
  const values = [openid];

  return new Promise((resolve, reject) => {
    query(sql, values, (err, results) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      if (results.length === 0) {
        return resolve(null);
      }

      resolve(results[0]);
    });
  });
};

export const createUserByOpenId = (openid, userInfo = {}) => {
  const { nickname = '', avatarUrl = '' } = userInfo;

  const sql = `INSERT INTO users (open_id, nickname, avatar_url) VALUES (?, ?, ?)`;

  return new Promise((resolve, reject) => {
    query(sql, [openid, nickname, avatarUrl], (err, result) => {
      if (err) return reject(err);
      resolve(result.insertId);
    });
  });
};