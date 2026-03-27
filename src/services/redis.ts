import Redis from "ioredis";
import { env } from "env";

function createRedisClient() {
  const url = new URL(env.REDIS_URL);
  return new Redis({
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    family: 0,
  });
}

let pub: Redis | null = null;
let sub: Redis | null = null;

export function getPublisher() {
  if (!pub) {
    pub = createRedisClient();
  }
  return pub;
}

export function getSubscriber() {
  if (!sub) {
    sub = createRedisClient();
  }
  return sub;
}
