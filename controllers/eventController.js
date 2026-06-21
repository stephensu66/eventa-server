import { query } from '../config/db.js';
import { normalizeTypeFields } from './utils.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, defaultBothActImageUrl, defaultOnlineActImageUrl, defaultOnsiteActImageUrl, defaultSkillImageUrl } from '../constants/index.js';

const typeFields = ['is_online', 'is_free', 'is_onsite', 'event_type', 'is_paid', 'is_favorited', 'is_joined'];

const pickDefaultImageUrl = ({ event_type, is_online, is_onsite }) => {
  if (Number(event_type) === 2 || event_type === 'skill') {
    return defaultSkillImageUrl;
  }
  if (is_onsite && is_online) {
    return defaultBothActImageUrl;
  }
  if (is_onsite) {
    return defaultOnsiteActImageUrl;
  }
  if (is_online) {
    return defaultOnlineActImageUrl;
  }
  return defaultBothActImageUrl || '';
};

const formatEventTime = (time) => {
  if (!time) return '';
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return String(time);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const createNotification = async ({ userId, eventId = null, type, message }) => {
  if (!userId || !message) return;
  await query(
    'INSERT INTO notifications (user_id, event_id, type, message) VALUES (?, ?, ?, ?)',
    [userId, eventId, type || 'custom', message]
  );
};

const createNotificationsBulk = async (items = []) => {
  const rows = items
    .filter((item) => item?.userId && item?.message)
    .map((item) => [item.userId, item.eventId || null, item.type || 'custom', item.message]);
  if (rows.length === 0) return;
  await query(
    'INSERT INTO notifications (user_id, event_id, type, message) VALUES ?',
    [rows]
  );
};

// 发布活动
export async function createActivity(req, res) {
  console.log(12, req.user)
  const host_id = req.user.userId;
  const { event_type, event_image_urls, event_title, event_description, is_free, is_online, is_onsite, longitude, latitude, full_address, link, start_time, end_time, max_participate_num  } = req.body;
  const sql = 'INSERT INTO events ( event_type, event_title, event_description, is_free, is_online, is_onsite, longitude, latitude, full_address, link, start_time, end_time, max_participate_num, host_id ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [
    event_type,
    event_title,
    event_description,
    is_free,
    is_online,
    is_onsite,
    longitude, 
    latitude, 
    full_address,
    link,
    start_time,
    end_time,
    max_participate_num,
    host_id
  ];

  try {
    const [result] = await query(sql, values);
    console.log(44, result.insertId)
    const eventId = result.insertId;
    let imageValues = [];
    console.log(45, event_image_urls, event_type, is_online, is_onsite);
    if (!event_image_urls || !Array.isArray(event_image_urls) || event_image_urls.length === 0) {
      const defaultImageUrl = pickDefaultImageUrl({ event_type, is_online, is_onsite });
      if (defaultImageUrl) {
        imageValues = [[eventId, defaultImageUrl, 'image', 'system', 0]];
      }
    } else {
      console.log(45, result)
      imageValues = event_image_urls.map((url, index) => [eventId, url, 'image', 'user', index]);
    }

    if (imageValues.length > 0) {
      const imageSql = `INSERT INTO event_images (event_id, image_url, file_type, source_type, sort_order) VALUES ?`;
      await query(imageSql, [imageValues]);
    }

    await createNotification({
      userId: host_id,
      eventId: eventId,
      type: 'event_published',
      message: `活动《${event_title}》已发布，开始时间：${formatEventTime(start_time)}`
    });

    res.send({ message: 'event created successfully', id: eventId });
  } catch (err) {
    console.error('[createActivity][DB ERROR]', err);
    res.status(500).send({ message: 'error in database' });
  }
}

// 获取活动列表
export async function getActivityList(req, res) {
  let userId = req.user?.userId;
  if (!userId) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (_err) {
        // Ignore invalid token for public list, fallback to anonymous view.
      }
    }
  }
  console.log(3456, userId)

  const sql = userId
    ? `
      SELECT
        e.*,
        (
          SELECT image_url
          FROM event_images
          WHERE event_id = e.event_id
            AND is_active = 1
          ORDER BY sort_order ASC
          LIMIT 1
        ) AS cover_image,
        IF(f.id IS NULL, 0, 1) AS is_favorited
      FROM events e
      LEFT JOIN event_favorites f
        ON f.event_id = e.event_id
        AND f.user_id = ?
      WHERE e.event_status NOT IN (4, 6)
        AND e.end_time >= NOW()
      ORDER BY e.start_time DESC
    `
    : `
      SELECT
        e.*,
        (
          SELECT image_url
          FROM event_images
          WHERE event_id = e.event_id
            AND is_active = 1
          ORDER BY sort_order ASC
          LIMIT 1
        ) AS cover_image,
        0 AS is_favorited
      FROM events e
      WHERE e.event_status NOT IN (4, 6)
        AND e.end_time >= NOW()
      ORDER BY e.start_time DESC
    `;

  const params = userId ? [userId] : [];
  
  try {
    const [results] = await query(sql, params);
    const withDefaultCover = results.map((item) => ({
      ...item,
      cover_image: item.cover_image || pickDefaultImageUrl(item)
    }));
    console.log(23, results)
    const normalizedResults = normalizeTypeFields(withDefaultCover, ['is_online', 'is_free', 'is_onsite', 'event_type', 'is_paid', 'is_favorited']);
    res.status(200).send(normalizedResults);
  } catch (error) {
    console.error('[getActivityList][DB ERROR]', error);
    res.status(500).send({
      message: 'error is in database',
      error: error.message
    });
  }
}

// Get event detail by event_id
export async function getActivityDetail(req, res) {
  const { event_id } = req.query;
  console.log(122, req.user, event_id);
  const userId = req.user?.userId;

  const sql = userId
    ? `
      SELECT
        e.*,
        i.id AS image_id,
        i.image_url,
        (SELECT u.nickname FROM users u WHERE u.id = e.host_id LIMIT 1) AS organizer_nickname,
        IF(f.id IS NULL, 0, 1) AS is_favorited,
        IF(p.id IS NULL, 0, 1) AS is_joined
      FROM events e
      LEFT JOIN event_images i
        ON e.event_id = i.event_id AND i.is_active = 1
      LEFT JOIN event_favorites f
        ON f.event_id = e.event_id
       AND f.user_id = ?
      LEFT JOIN event_participants p
        ON p.event_id = e.event_id
       AND p.user_id = ?
       AND p.status = 'joined'
      WHERE e.event_id = ?
    `
    : `
      SELECT
        e.*,
        i.id AS image_id,
        i.image_url,
        (SELECT u.nickname FROM users u WHERE u.id = e.host_id LIMIT 1) AS organizer_nickname,
        0 AS is_favorited,
        0 AS is_joined
      FROM events e
      LEFT JOIN event_images i
        ON e.event_id = i.event_id AND i.is_active = 1
      WHERE e.event_id = ?
    `;

  const params = userId ? [userId, userId, event_id] : [event_id];

  try {
    const [results] = await query(sql, params);
    console.log(125, results);
    const eventRes = {
      ...results[0],
      images: results
        .filter(row => row.image_url)
        .map(row => ({
          image_id: row.image_id,
          image_url: row.image_url,
        }))
    };

    if (eventRes.images.length === 0) {
      const defaultImageUrl = pickDefaultImageUrl(eventRes);
      if (defaultImageUrl) {
        eventRes.images = [{ image_id: 'system-default', image_url: defaultImageUrl }];
      }
    }

    console.log(126, eventRes);
    const normalizedResults = normalizeTypeFields(eventRes, typeFields);
    res.status(200).send(normalizedResults);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'error in database' });
  }
}

async function getPublishedActivities(userId, res) {
  const sql = `
    SELECT 
      e.*,
      (
        SELECT image_url
        FROM event_images
        WHERE event_id = e.event_id
          AND is_active = 1
        ORDER BY sort_order ASC
        LIMIT 1
      ) AS cover_image
    FROM events e
    WHERE e.host_id = ?
      AND e.event_status NOT IN (4, 6)
    ORDER BY e.start_time DESC
  `;

  try {
    const [results] = await query(sql, [userId]);
    const withDefaultCover = results.map((item) => ({ ...item, cover_image: item.cover_image || pickDefaultImageUrl(item) }));
    res.send(normalizeTypeFields(withDefaultCover, typeFields));
  } catch (err) {
    console.error('[published][DB ERROR]', err);
    return res.status(500).send({ message: 'database error' });
  }
}

async function getJoinedActivities(userId, res) {
  const sql = `
    SELECT 
      e.*,
      (
        SELECT image_url
        FROM event_images
        WHERE event_id = e.event_id
          AND is_active = 1
        ORDER BY sort_order ASC
        LIMIT 1
      ) AS cover_image
    FROM event_participants p
    JOIN events e ON p.event_id = e.event_id
    WHERE p.user_id = ?
      AND p.status = 'joined'
    ORDER BY e.start_time DESC
  `;

  try {
    const [results] = await query(sql, [userId]);
    const withDefaultCover = results.map((item) => ({ ...item, cover_image: item.cover_image || pickDefaultImageUrl(item) }));
    res.send(normalizeTypeFields(withDefaultCover, typeFields));
  } catch (err) {
    console.error('[joined][DB ERROR]', err);
    return res.status(500).send({ message: 'database error' });
  }
}

async function getSavedActivities(userId, res) {
  const sql = `
    SELECT 
      e.*,
      (
        SELECT image_url
        FROM event_images
        WHERE event_id = e.event_id
          AND is_active = 1
        ORDER BY sort_order ASC
        LIMIT 1
      ) AS cover_image
    FROM event_favorites f
    JOIN events e ON f.event_id = e.event_id
    WHERE f.user_id = ?
    ORDER BY e.start_time DESC
  `;

  try {
    const [results] = await query(sql, [userId]);
    const withDefaultCover = results.map((item) => ({ ...item, cover_image: item.cover_image || pickDefaultImageUrl(item) }));
    res.send(normalizeTypeFields(withDefaultCover, typeFields));
  } catch (err) {
    console.error('[saved][DB ERROR]', err);
    return res.status(500).send({ message: 'database error' });
  }
}


export async function getActivityListByUserStatus(req, res) {
  const userId = req.user.userId;
  const { status } = req.query;
  console.log(2, status)

  switch (status) {
    case 'published':
      return await getPublishedActivities(userId, res);
    case 'joined':
      return await getJoinedActivities(userId, res);
    case 'saved':
      return await getSavedActivities(userId, res);
    default:
      return res.status(400).send({ message: 'invalid status' });
  }
}

// Mark event as deleted
export async function updateActivityDetail(req, res) {
  const { event_id, order } = req.body;

  try {
    if (order === 'update') {
      const { event_id, event_image_urls: updateImageUrls = [], event_type, event_title, event_description,
        is_free, is_online, is_onsite, link,
        start_time, end_time, max_participate_num } = req.body;

      const updateSql = `
        UPDATE events
        SET event_type=?, event_title=?, event_description=?, is_free=?,
            is_online=?, is_onsite=?, link=?, start_time=?, end_time=?,
            max_participate_num=?, updated_time=NOW()
        WHERE event_id=?
      `;

      const values = [
        event_type, event_title, event_description, is_free,
        is_online, is_onsite, link, start_time, end_time,
        max_participate_num, event_id
      ];

      // 1. update event info except image urls
      await query(updateSql, values);

      // 2. make old image url as inactive as deleted status
      const deleteImageSql = `
        UPDATE event_images 
        SET is_active = FALSE
        WHERE event_id = ?`;
      await query(deleteImageSql, [event_id]);

      // 3. update new image url into database
      if (updateImageUrls.length > 0) {
        const insertSql = `
          INSERT INTO event_images (event_id, image_url, file_type, source_type, sort_order)
          VALUES ?
        `;
        const imageValues = updateImageUrls.map((url, index) => [event_id, url, 'image', 'user', index]);
        await query(insertSql, [imageValues]);
      } else {
        const defaultImageUrl = pickDefaultImageUrl({ event_type, is_online, is_onsite });
        if (defaultImageUrl) {
          await query(
            `INSERT INTO event_images (event_id, image_url, file_type, source_type, sort_order) VALUES (?, ?, 'image', 'system', 0)`,
            [event_id, defaultImageUrl]
          );
        }
      }

      return res.status(200).send('event and images updated successfully');
    }

    let sql;
    let notifyCancelledParticipants = false;
    if (order === 'delete') {
      sql = `
        UPDATE events
        SET event_status = 6
        WHERE event_id = ?
      `;
      notifyCancelledParticipants = true;
    } else if (order === 'cancel') {
      sql = `
        UPDATE events
        SET event_status = 4
        WHERE event_id = ?
      `;
      notifyCancelledParticipants = true;
    } else {
      return res.status(400).send({ message: 'invalid order' });
    }

    let eventMeta = null;
    let participantRows = [];
    if (notifyCancelledParticipants) {
      const [eventRows] = await query(
        'SELECT event_id, event_title, start_time FROM events WHERE event_id = ? LIMIT 1',
        [event_id]
      );
      eventMeta = eventRows[0] || null;
      const [rows] = await query(
        `SELECT user_id
         FROM event_participants
         WHERE event_id = ? AND status = 'joined'`,
        [event_id]
      );
      participantRows = rows || [];
    }

    await query(sql, [event_id]);

    if (notifyCancelledParticipants && eventMeta) {
      await createNotificationsBulk(
        participantRows.map((row) => ({
          userId: row.user_id,
          eventId: event_id,
          type: 'event_cancelled',
          message: `活动《${eventMeta.event_title}》已取消，原定开始时间：${formatEventTime(eventMeta.start_time)}`
        }))
      );
    }

    return res.status(200).send('event updated successfully');
  } catch (err) {
    console.error('[updateActivityDetail][DB ERROR]', err);
    return res.status(500).send({ message: 'error in database' });
  }
}

export const updateImages = (req, res) => {

}

export async function addFavorite(req, res) {
  try {
    const { userId } = req.user;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: '缺少 event_id' });
    }

    await query(
      `INSERT IGNORE INTO event_favorites (event_id, user_id) VALUES (?, ?)`,
      [event_id, userId]
    );

    return res.json({ message: '收藏成功', is_favorited: true });
  } catch (err) {
    console.error('addFavorite error:', err);
    return res.status(500).json({ message: '收藏失败' });
  }
}

export async function removeFavorite(req, res) {
  try {
    const { userId } = req.user;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: '缺少 event_id' });
    }

    await query(
      `DELETE FROM event_favorites WHERE event_id = ? AND user_id = ?`,
      [event_id, userId]
    );

    return res.json({ message: '取消收藏成功', is_favorited: false });
  } catch (err) {
    console.error('removeFavorite error:', err);
    return res.status(500).json({ message: '取消收藏失败' });
  }
}
