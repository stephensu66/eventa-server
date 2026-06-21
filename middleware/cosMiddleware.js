import COS from 'cos-nodejs-sdk-v5';
import { COS_BUCKET, COS_REGION, COS_SECRET_ID, COS_SECRET_KEY } from '../constants/index.js';

const BUCKET = COS_BUCKET;
const REGION = COS_REGION;

/**
 * 获取 COS 临时密钥中间件
 */
export const getCOSstsMiddleware = (req, res, next) => {
  const rawFileName = req.body?.fileName;
  const fileName = typeof rawFileName === 'string' ? rawFileName.split('/').pop() : '';

  if (!fileName) {
    return res.status(400).json({ message: 'fileName 不能为空' });
  }

  const key = `uploads/images/${Date.now()}_${fileName}`;
  const startTime = Math.floor(Date.now() / 1000) - 1;
  const expiredTime = startTime + 1800; // 30min

  try {
    const authorization = COS.getAuthorization({
      SecretId: COS_SECRET_ID,
      SecretKey: COS_SECRET_KEY,
      Method: 'PUT',
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      KeyTime: `${startTime};${expiredTime}`
    });

    req.cosSts = {
      authorization,
      startTime,
      expiredTime,
      key,
      bucket: BUCKET,
      region: REGION
    };
    next();
  } catch (err) {
    return res.status(500).json({ message: '生成 COS 签名失败', error: String(err) });
  }
};
