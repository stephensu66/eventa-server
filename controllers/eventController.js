import { query } from '../config/db.js';
import { normalizeTypeFields } from './utils.js';

// 发布活动
export function createActivity(req, res) {
  console.log(12, req.user)
  const host_id = req.user.useId;
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

  query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: 'error in database' });
    }

    if (!event_image_urls || !Array.isArray(event_image_urls) || event_image_urls.length === 0) {
      return res.send({ message: 'event created successfully' });
    }
    console.log(45, result)
    // Upload images to event_images database
    const eventId = result.insertId;
    const imageValues = event_image_urls.map((url, index) => [eventId, url, 'image', index]);
    const imageSql = `INSERT INTO event_images (event_id, image_url, file_type, sort_order) VALUES ?`;

    query(imageSql, [imageValues], (err2) => {
      if (err2) {
        console.error('Insert event_images error:', err2);
        return res.status(500).send({ message: 'event created, but image insert failed' });
      }

      res.send({ message: 'event created successfully', id: eventId });
    });
  });
}

// 获取活动列表
export function getActivityList(req, res) {
  try {
    query('SELECT * FROM events', (err, results) => {
      if (err) {
        console.error('[getActivityList][DB ERROR]', err);
        return res.status(500).send({ message: 'error is in database' });
      }
      console.log(23, results)
      const normalizedResults = normalizeTypeFields(results, ['is_online', 'is_free', 'is_onsite', 'event_type', 'is_paid', 'is_favorited']);

      res.status(200).send(normalizedResults);
    });
  } catch (error) {
    console.error('[getActivityList][UNEXPECTED ERROR]', error);
    res.status(500).send({
      message: 'unexpected server error',
      error: err.message
    });
  }
}

// Get event detail by event_id
export function getActivityDetail(req, res) {
  const { event_id } = req.query;

  const sql = `
    SELECT 
      e.*,
      i.id AS image_id,
      i.image_url
    FROM events e
    LEFT JOIN event_images i
      ON e.event_id = i.event_id AND i.is_active = 1
    WHERE e.event_id = ?
  `;

  query(sql, [event_id], (err, results) => {
    if (err) {
      return res.status(500).send({ message: 'error in database' });
    }

    const eventRes = {
      ...results[0],
      images: results
        .filter(row => row.image_url)
        .map(row => ({
          image_id: row.image_id,
          image_url: row.image_url,
        }))
    };

    const normalizedResults = normalizeTypeFields(eventRes, ['is_online', 'is_free', 'is_onsite', 'event_type', 'is_paid', 'is_favorited']);
    res.status(200).send(normalizedResults);
  });
}

// Mark event as deleted
export function updateActivityDetail(req, res) {
  const { event_id, order } = req.body;

  let sql;

  if (order === 'update') {
    const { event_id, event_image_urls: updateImageUrls, event_type, event_title, event_description,
      is_free, is_online, is_onsite, link,
      start_time, end_time, max_participate_num, host_id } = req.body;

    sql = `
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
    query(sql, values, (err, results) => {
      if (err) {
        return res.status(500).send({ message: 'error in database' });
      }

      // 2. make old image url as inactive as deleted status
      const deleteImageSql = `
        UPDATED event_images 
        SET is_active = FALSE
        WHERE event_id = ?`;
  
      query(deleteImageSql, [event_id], (err) => {
        if (err) return res.status(500).send({ message: 'failed to mark images inactive' });
        // 3. update new image url into database
        if (updateImageUrls.length > 0) {
          const insertSql = `
            INSERT INTO event_images (event_id, image_url, file_type, sort_order)
            VALUES ?
          `;
          const values = updateImageUrls.map((url, index) => [event_id, url, 'image', index]);

          query(insertSql, [values], (errIns) => {
            if (errIns) return res.status(500).send({ message: 'failed to insert new images' });
            res.status(200).send('event and images updated successfully');
          });
        } else {
          res.status(200).send('event and images updated successfully');
        }
      })
    });
  }

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
  } else 


  query(sql, [event_id], (err, results) => {
    if (err) {
      return res.status(500).send({ message: 'error in database' });
    }

    res.status(200).send('event updated successfully');
  });
}

export const updateImages = (req, res) => {

}