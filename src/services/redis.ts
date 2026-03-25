import Redis from "ioredis";
import { env } from "env";

let pub: Redis | null = null;
let sub: Redis | null = null;

export function getPublisher() {
  if (!pub) {
    pub = new Redis(env.REDIS_URL);
  }
  return pub;
}

export function getSubscriber() {
  if (!sub) {
    sub = new Redis(env.REDIS_URL);
  }
  return sub;
}
