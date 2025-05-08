import { query } from '../config/db';

export const createUser = async(req, res)  => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: 'Missing required fields' });
  }
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  const values = [username, email, hashedPassword];

  query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: 'Database error while creating user' });
    }

    res.send({ message: 'User created successfully', userId: result.insertId });
  });
}

export const login= async(req, res) => {
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
}