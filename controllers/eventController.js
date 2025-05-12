import { query } from '../config/db.js';

// 发布活动
export function createActivity(req, res) {
  const { event_title, event_description, is_free, is_online, is_onsite, link, start_time, end_time, max_participate_num, host_id  } = req.body;
  const sql = 'INSERT INTO events ( event_title, event_description, is_free, is_online, is_onsite, link, start_time, end_time, max_participate_num, host_id ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [
    event_title,
    event_description,
    is_free,
    is_online,
    is_onsite,
    link,
    start_time,
    end_time,
    max_participate_num,
    host_id
  ];

  query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'error in database' });
    }
    res.send({ message: 'event created successfully', id: result.insertId });
  });
}

// 获取活动列表
export function getActivityList(req, res) {
  query('SELECT * FROM events', (err, results) => {
    if (err) {
      return res.status(500).send({ message: 'error in database' });
    }
    res.send(results);
  });
}
