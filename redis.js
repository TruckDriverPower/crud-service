// require("dotenv").config();
import redis from "redis"
// const redis = require("redis")

export const redisConfig = {
  pkg: "ioredis",
  host: process.env.REDIS_URL,
  password: null,
  port: process.env.REDIS_PORT,
  database: 0,
  namespace: "",
  looping: true,
  // options: {password: 'abc'},
}
