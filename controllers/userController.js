import db, { query } from '../config/db.js';
import { APPID, APPSECRET, JWT_SECRET } from '../constants/index.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { createUserByOpenId, getUserByOpenId } from '../services/index.js';

const formatEventTime = (time) => {
  if (!time) return '';
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return String(time);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const createNotification = async ({ userId, eventId = null, type, message }) => {
  if (!userId || !message) return;
  await db.query(
    'INSERT INTO notifications (user_id, event_id, type, message) VALUES (?, ?, ?, ?)',
    [userId, eventId, type || 'custom', message]
  );
};

const getEventMeta = async (eventId) => {
  const [rows] = await db.query(
    'SELECT event_id, event_title, start_time, host_id FROM events WHERE event_id = ? LIMIT 1',
    [eventId]
  );
  return rows[0] || null;
};

const getUserNickname = async (userId) => {
  const [rows] = await db.query('SELECT nickname FROM users WHERE id = ? LIMIT 1', [userId]);
  return rows[0]?.nickname || `用户${userId}`;
};

export const createUser = async(req, res)  => {
  try {
    const { code, newUserInfo } = req.body.data;

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

    const { openid, errcode, errmsg } = wxRes.data;
    console.log(1221, req.body, wxRes.data, openid);
    if (!openid) {
      return res.status(400).send({
        message: `WeChat login failed: ${errcode || ''} ${errmsg || ''}`.trim()
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
  } catch (error) {
    console.error('createUser error:', error?.response?.data || error);
    res.status(500).send({ message: 'Server error in register' });
  }

  

  // if (!username || !email || !password) {
  //   return res.status(400).send({ message: 'Missing required fields' });
  // }
  // const saltRounds = 10;
  // const hashedPassword = await bcrypt.hash(password, saltRounds);
}

// 暂时未用到
export const checkUser = async(req, res) => {
  const { username, password } = req.body;

  try {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const [users] = await query(sql, [username]);
    const user = users[0];

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

    const eventMeta = await getEventMeta(event_id);
    if (!eventMeta) {
      return res.status(404).json({ message: '活动不存在' });
    }
    const actorName = await getUserNickname(userId);

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
      await createNotification({
        userId,
        eventId: event_id,
        type: 'event_signup_success',
        message: `已报名《${eventMeta.event_title}》，活动开始时间：${formatEventTime(eventMeta.start_time)}`
      });
      if (eventMeta.host_id && Number(eventMeta.host_id) !== Number(userId)) {
        await createNotification({
          userId: eventMeta.host_id,
          eventId: event_id,
          type: 'event_signup_success',
          message: `${actorName} 报名了你发布的活动《${eventMeta.event_title}》`
        });
      }
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
      await createNotification({
        userId,
        eventId: event_id,
        type: 'event_signup_success',
        message: `已重新报名《${eventMeta.event_title}》，活动开始时间：${formatEventTime(eventMeta.start_time)}`
      });
      if (eventMeta.host_id && Number(eventMeta.host_id) !== Number(userId)) {
        await createNotification({
          userId: eventMeta.host_id,
          eventId: event_id,
          type: 'event_signup_success',
          message: `${actorName} 重新报名了你发布的活动《${eventMeta.event_title}》`
        });
      }
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

export const cancelJoinEvent = async (req, res) => {
  try {
    const { event_id } = req.body;
    const { userId } = req.user;

    if (!event_id || !userId) {
      return res.status(400).json({ message: '缺少参数 event_id 或 userId' });
    }

    const eventMeta = await getEventMeta(event_id);
    if (!eventMeta) {
      return res.status(404).json({ message: '活动不存在' });
    }

    const [rows] = await db.query(
      'SELECT * FROM event_participants WHERE event_id = ? AND user_id = ? LIMIT 1',
      [event_id, userId]
    );

    if (rows.length === 0 || rows[0].status !== 'joined') {
      return res.json({ message: '当前未报名该活动', status: 'cancelled' });
    }

    await db.query(
      `UPDATE event_participants
       SET status = 'cancelled'
       WHERE event_id = ? AND user_id = ?`,
      [event_id, userId]
    );

    const actorName = await getUserNickname(userId);
    await createNotification({
      userId,
      eventId: event_id,
      type: 'event_signup_cancel',
      message: `你已取消报名《${eventMeta.event_title}》`
    });
    if (eventMeta.host_id && Number(eventMeta.host_id) !== Number(userId)) {
      await createNotification({
        userId: eventMeta.host_id,
        eventId: event_id,
        type: 'event_signup_cancel',
        message: `${actorName} 取消报名了你发布的活动《${eventMeta.event_title}》`
      });
    }

    return res.json({ message: '取消报名成功', status: 'cancelled' });
  } catch (error) {
    console.error('cancelJoinEvent error:', error);
    return res.status(500).json({ message: '服务器错误' });
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
    userId = decoded.userId;
  } catch (err) {
    return res.status(401).send({ message: 'token 无效或已过期' });
  }

  try {
    const stats = {};

    // 发布的活动数
    const [published] = await db.query(
      `SELECT COUNT(*) as count
       FROM events
       WHERE host_id = ?
         AND event_status NOT IN (4, 6)`,
      [userId]
    );
    stats.submitted_events_count = published[0].count;

    // 报名的活动数
    const [joined] = await db.query(
      `SELECT COUNT(*) as count
       FROM event_participants p
       JOIN events e ON p.event_id = e.event_id
       WHERE p.user_id = ?
         AND p.status = 'joined'`,
      [userId]
    );
    stats.joined_events_count = joined[0].count;

    // 收藏活动数
    const [saved] = await db.query(
      `SELECT COUNT(*) as count
       FROM event_favorites f
       JOIN events e ON f.event_id = e.event_id
       WHERE f.user_id = ?`,
      [userId]
    );
    stats.saved_events_count = saved[0].count;

    // 消息总数（和通知列表内容数量一致）
    const [notificationTotal] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ?',
      [userId]
    );
    stats.notifications_count = notificationTotal[0].count;

    // 未读通知数
    const [notifications] = await db.query(
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

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const [rows] = await db.query(
      `SELECT id, event_id, type, message, is_read, created_time
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_time DESC
       LIMIT 100`,
      [userId]
    );

    res.json({ message: '获取成功', data: rows });
  } catch (err) {
    console.error('获取消息通知失败:', err);
    res.status(500).json({ message: '获取消息通知失败' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: '缺少通知 id' });
    }

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新通知状态失败:', err);
    return res.status(500).json({ message: '更新通知状态失败' });
  }
};

export const submitUserFeedback = async (req, res) => {
  try {
    const { userId } = req.user;
    const { sender_type, sender_contact, content } = req.body || {};
    const senderContact = String(sender_contact || '').trim();
    const feedbackContent = String(content || '').trim();

    const inferSenderType = (value) => {
      if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) return 'email';
      if (/^1\d{10}$/.test(value) || /^\+?\d[\d -]{5,}$/.test(value)) return 'phone';
      if (/^[a-zA-Z][-_a-zA-Z0-9]{4,}$/.test(value)) return 'wechat';
      return 'other';
    };
    const normalizedSenderType = ['wechat', 'email', 'phone', 'other'].includes(sender_type)
      ? sender_type
      : inferSenderType(senderContact);

    if (!senderContact || !feedbackContent) {
      return res.status(400).json({ message: '请填写发件人和反馈内容' });
    }

    await db.query(
      `INSERT INTO user_feedbacks (user_id, sender_type, sender_contact, content)
       VALUES (?, ?, ?, ?)`,
      [userId, normalizedSenderType, senderContact, feedbackContent]
    );

    return res.json({ message: '反馈已提交' });
  } catch (error) {
    console.error('submitUserFeedback error:', error);
    return res.status(500).json({ message: '提交反馈失败' });
  }
};
