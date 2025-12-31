import db, { query } from '../config/db.js';
import { APPID, APPSECRET, JWT_SECRET } from '../constants/index.js';
import jwt from 'jsonwebtoken';
import { createUserByOpenId, getUserByOpenId } from '../services/index.js';

export const createUser = async(req, res)  => {
  const { code, newUserInfo } = req.body;

  // 1. 用 code 换 openid
  const wxRes = await axios.get(
    `https://api.weixin.qq.com/sns/jscode2session`,
    {
      params: {
        appid: APPID,
        secret: APPSECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    }
  );

  const { openid } = wxRes.data;
  if (!openid) {
  return res.status(400).send({
    message: 'WeChat login failed',
    errcode,
    errmsg
  });
}
  console.log(13, newUserInfo, openid)

  // 2. 查用户
  const user = await getUserByOpenId(openid);

  let userId;
  if (!user) {
    // 3. 不存在就创建
    userId = await createUserByOpenId(openid, newUserInfo);
  } else {
    userId = user.id;
  }

  // 4. 生成 token
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d'
  });

  res.send({ token });

  

  // if (!username || !email || !password) {
  //   return res.status(400).send({ message: 'Missing required fields' });
  // }
  // const saltRounds = 10;
  // const hashedPassword = await bcrypt.hash(password, saltRounds);
}

export const checkUser = async(req, res) => {
  const { username, password } = req.body;

  try {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [user] = await query(sql, [username]);

    if (!user) {
      return res.status(400).send({ message: '用户名不存在' });
    }
    
    // Check the user's password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).send({ message: '密码错误' });
    }

    res.send({ message: '登录成功' });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).send({ message: '登录失败' });
  }
};

export const joinEvent = async (req, res) => {
  try {
    const { event_id } = req.body;
    const { userId } = req.user;

    if (!event_id || !userId) {
      return res.status(400).json({ message: '缺少参数 event_id 或 userId' });
    }

    const [rows] = await db.query(
      'SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?',
      [event_id, userId]
    );

    if (rows.length === 0) {
      await db.query(
        `INSERT INTO event_participants (event_id, user_id, status) 
        VALUES (?, ?, 'joined')`,
        [event_id, userId]
      );
      return res.json({ message: '报名成功', status: 'joined' });
    }

    const participant = rows[0];
    if (participant.status === 'cancelled') {
      await db.query(
        `UPDATE event_participants 
        SET status = 'joined', joined_time = CURRENT_TIMESTAMP 
        WHERE event_id = ? AND user_id = ?`,
        [event_id, userId]
      );
      return res.json({ message: '重新报名成功', status: 'joined' });
    }

    if (participant.status === 'joined') {
      return res.json({ message: '已报名该活动', status: 'joined' });
    }

  } catch (error) {
    console.error('joinEvent error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const getUserStats = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send({ message: '缺少 token' });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.user_id;
  } catch (err) {
    return res.status(401).send({ message: 'token 无效或已过期' });
  }

  try {
    const stats = {};

    // 已发布活动数
    const [published] = await db.promise().query(
      'SELECT COUNT(*) as count FROM events WHERE host_id = ?',
      [userId]
    );
    stats.submitted_events_count = published[0].count;

    // 已参与活动数
    const [joined] = await db.promise().query(
      'SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?',
      [userId]
    );
    stats.joined_events_count = joined[0].count;

    // 收藏活动数
    const [saved] = await db.promise().query(
      'SELECT COUNT(*) as count FROM event_favorites WHERE user_id = ?',
      [userId]
    );
    stats.saved_events_count = saved[0].count;

    // 未读通知数
    const [notifications] = await db.promise().query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    stats.unread_notifications_count = notifications[0].count;

    res.send({ message: '获取成功', data: stats });
    console.log(2, stats);
  } catch (err) {
    console.error('获取用户统计信息失败:', err);
    res.status(500).send({ message: 'Error in Server' });
  }
};

export const uploadUserInfo = async (req, res) => {
  const { avatarUrl, nickName, lastUpdatedUserInfo, description } = req.body;
  const { userId } = req.user;

  const sql = 'UPDATE users SET avatar_url = ?, nickname = ?, last_updated_userInfo_time = ?, description = ? WHERE id = ?';
  await db.query(sql, [avatarUrl, nickName, lastUpdatedUserInfo, description, userId]);

  res.json({ message: 'Update user info successfully' });
};
