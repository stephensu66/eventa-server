import dotenv from 'dotenv';
dotenv.config();

const APPID = process.env.APPID;
const APPSECRET = process.env.APPSECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const COS_SECRET_ID = process.env.SecretId;
const COS_SECRET_KEY = process.env.SecretKey;

export {
  APPID, APPSECRET, JWT_SECRET, COS_SECRET_ID, COS_SECRET_KEY
}