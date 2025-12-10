import dotenv from 'dotenv';
dotenv.config();

const APPID = process.env.APPID;
const APPSECRET = process.env.APPSECRET;
const JWT_SECRET = process.env.JWT_SECRET;

const COS_SECRET_ID = process.env.SecretId;
const COS_SECRET_KEY = process.env.SecretKey;

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USER = process.env.DB_USER;
const DB_DATABASE = process.env.DB_DATABASE;
const DB_PASSWORD = process.env.DB_PASSWORD;

export {
  APPID, 
  APPSECRET, 
  JWT_SECRET, 
  COS_SECRET_ID, 
  COS_SECRET_KEY,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_DATABASE,
  DB_PASSWORD
}