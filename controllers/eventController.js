import { query } from '../config/db.js';
import { normalizeTypeFields } from './utils.js';

const typeFields = ['is_online', 'is_free', 'is_onsite', 'event_type', 'is_paid', 'is_favorited'];

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
    if (!event_image_urls || !Array.isArray(event_image_urls) || event_image_urls.length === 0) {
      return res.send({ message: 'event created successfully' });
    }

    console.log(45, result)
    // Upload images to event_images database
    const eventId = result.insertId;
    const imageValues = event_image_urls.map((url, index) => [eventId, url, 'image', index]);
    const imageSql = `INSERT INTO event_images (event_id, image_url, file_type, sort_order) VALUES ?`;

    await query(imageSql, [imageValues]);
    res.send({ message: 'event created successfully', id: eventId });
  } catch (err) {
    console.error('[createActivity][DB ERROR]', err);
    res.status(500).send({ message: 'error in database' });
  }
}

// 获取活动列表
export async function getActivityList(req, res) {
  const userId = req.user?.userId;
  console.log(3456, userId)

  const sql = userId
    ? `
      SELECT
        e.*,
        IF(f.id IS NULL, 0, 1) AS is_favorited
      FROM events e
      LEFT JOIN event_favorites f
        ON f.event_id = e.event_id
        AND f.user_id = ?
      ORDER BY e.start_time DESC
    `
    : `
      SELECT
        e.*,
        0 AS is_favorited
      FROM events e
      ORDER BY e.start_time DESC
    `;

  const params = userId ? [userId] : [];
  
  try {
    const [results] = await query(sql, params);
    console.log(23, results)
    const normalizedResults = normalizeTypeFields(results, ['is_online', 'is_free', 'is_onsite', 'event_type', 'is_paid', 'is_favorited']);
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
  const userId = req.user?.userId;

  const sql = userId
    ? `
      SELECT
        e.*,
        i.id AS image_id,
        i.image_url,
        IF(f.id IS NULL, 0, 1) AS is_favorited
      FROM events e
      LEFT JOIN event_images i
        ON e.event_id = i.event_id AND i.is_active = 1
      LEFT JOIN event_favorites f
        ON f.event_id = e.event_id
       AND f.user_id = ?
      WHERE e.event_id = ?
    `
    : `
      SELECT
        e.*,
        i.id AS image_id,
        i.image_url,
        0 AS is_favorited
      FROM events e
      LEFT JOIN event_images i
        ON e.event_id = i.event_id AND i.is_active = 1
      WHERE e.event_id = ?
    `;

  const params = userId ? [userId, event_id] : [event_id];

  try {
    const [results] = await query(sql, params);
    const eventRes = {
      ...results[0],
      images: results
        .filter(row => row.image_url)
        .map(row => ({
          image_id: row.image_id,
          image_url: row.image_url,
        }))
    };

    const normalizedResults = normalizeTypeFields(eventRes, typeFields);
    res.status(200).send(normalizedResults);
  } catch (err) {
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
    ORDER BY e.start_time DESC
  `;

  try {
    const [results] = await query(sql, [userId]);
    res.send(normalizeTypeFields(results, typeFields));
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
    ORDER BY e.start_time DESC
  `;

  try {
    const [results] = await query(sql, [userId]);
    res.send(normalizeTypeFields(results, typeFields));
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
    res.send(normalizeTypeFields(results, typeFields));
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
        start_time, end_time, max_participate_num, host_id } = req.body;

      const updateSql = `
        UPDATE events
        SET event_type=?, event_title=?, event_description=?, is_free=?,
            is_online=?, is_onsite=?, link=?, start_time=?, end_time=?,
            max_participate_num=?, host_id=?, updated_time=NOW()
        WHERE event_id=?
      `;

      const values = [
        event_type, event_title, event_description, is_free,
        is_online, is_onsite, link, start_time, end_time,
        max_participate_num, host_id, event_id
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
          INSERT INTO event_images (event_id, image_url, file_type, sort_order)
          VALUES ?
        `;
        const imageValues = updateImageUrls.map((url, index) => [event_id, url, 'image', index]);
        await query(insertSql, [imageValues]);
      }

      return res.status(200).send('event and images updated successfully');
    }

    let sql;
    if (order === 'delete') {
      sql = `
        UPDATE events
        SET status = 'deleted'
        WHERE event_id = ?
      `;
    } else if (order === 'cancel') {
      sql = `
        UPDATE events
        SET status = 'cancelled'
        WHERE event_id = ?
      `;
    } else {
      return res.status(400).send({ message: 'invalid order' });
    }

    await query(sql, [event_id]);
    return res.status(200).send('event updated successfully');
  } catch (err) {
    return res.status(500).send({ message: 'error in database' });
  }
}

export const updateImages = (req, res) => {

}
