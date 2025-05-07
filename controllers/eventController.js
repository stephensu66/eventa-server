import { query } from '../config/db';

// 发布活动
export function createActivity(req, res) {
  const { title, time, people_limit, content } = req.body;
  const sql = 'INSERT INTO activities (title, time, people_limit, content) VALUES (?, ?, ?, ?)';
  query(sql, [title, time, people_limit, content], (err, result) => {
    if (err) {
      return res.status(500).send({ message: 'error in database' });
    }
    res.send({ message: 'create activity successfully', id: result.insertId });
  });
}

// 获取活动列表
export function getActivityList(req, res) {
  query('SELECT * FROM activities', (err, results) => {
    if (err) {
      return res.status(500).send({ message: 'error in database' });
    }
    res.send(results);
  });
}
