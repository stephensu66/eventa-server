import dotenv from 'dotenv';
dotenv.config();

const APP_HOST = process.env.APP_HOST || '0.0.0.0';
const APP_PORT = Number(process.env.APP_PORT || process.env.PORT) || 3300;

const APPID = process.env.APPID;
const APPSECRET = process.env.APPSECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const COS_SECRET_ID = process.env.COS_SECRET_ID || process.env.SecretId;
const COS_SECRET_KEY = process.env.COS_SECRET_KEY || process.env.SecretKey;
const COS_BUCKET = process.env.COS_BUCKET || 'eventa-cos-1368015931';
const COS_REGION = process.env.COS_REGION || 'ap-beijing';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_DATABASE = process.env.DB_DATABASE || 'taro_event';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_CONNECT_RETRIES = Number(process.env.DB_CONNECT_RETRIES) || 20;
const DB_CONNECT_DELAY_MS = Number(process.env.DB_CONNECT_DELAY_MS) || 3000;

const defaultSkillImageUrl = 'https://eventa-cos-1368015931.cos.ap-beijing.myqcloud.com/uploads/images/%E6%8A%80%E8%83%BD%E4%BA%A4%E6%8D%A2.png';
const defaultOnlineActImageUrl = 'https://eventa-cos-1368015931.cos.ap-beijing.myqcloud.com/uploads/images/online.png';
const defaultOnsiteActImageUrl = 'https://eventa-cos-1368015931.cos.ap-beijing.myqcloud.com/uploads/images/onsite.png';
const defaultBothActImageUrl = 'https://eventa-cos-1368015931.cos.ap-beijing.myqcloud.com/uploads/images/default-address.png';

export {
  APP_HOST,
  APP_PORT,
  APPID, 
  APPSECRET, 
  JWT_SECRET, 
  COS_SECRET_ID, 
  COS_SECRET_KEY,
  COS_BUCKET,
  COS_REGION,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_DATABASE,
  DB_PASSWORD,
  DB_CONNECT_RETRIES,
  DB_CONNECT_DELAY_MS,
  defaultSkillImageUrl,
  defaultOnlineActImageUrl,
  defaultOnsiteActImageUrl,
  defaultBothActImageUrl
};
