import COS from 'cos-nodejs-sdk-v5';
import { COS_SECRET_ID, COS_SECRET_KEY } from '../constants';

const cos = new COS({
  SecretId: COS_SECRET_ID,
  SecretKey: COS_SECRET_KEY
});

/**
 * 获取 COS 临时密钥中间件
 */
export const getCOSstsMiddleware = (req, res, next) => {
  const { fileName } = req.query;

  if (!fileName) return res.status(400).json({ error: 'fileName 不能为空' });

  cos.getSTS({
    Bucket: 'eventa-cos-1368015931',
    Region: 'ap-beijing',
    DurationSeconds: 1800,        // 临时密钥有效期 30 分钟
    AllowPrefix: `uploads/images/${fileName}`
  }, (err, data) => {
    if (err) return res.status(500).json({ error: err });
    
    // 把临时密钥挂到 req 上，方便后续处理
    req.cosSts = data;
    next();
  });
};
