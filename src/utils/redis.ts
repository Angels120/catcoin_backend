import { Redis } from "ioredis";
import dotenv from "dotenv";
import { env } from "node:process";
dotenv.config();
// const REDIS_PORT = Number(env["REDIS_PORT"] ?? 6379);
// const REDIS_HOST = env["REDIS_HOST"] ?? "127.0.0.1";
const REDIS_HOST = env["REDIS_URL"] ?? "127.0.0.1";

// console.log("REDIS_PORT", REDIS_PORT);
// console.log("REDIS_HOST", REDIS_HOST);

// const client = new Redis(REDIS_PORT, REDIS_HOST);
const client = new Redis(REDIS_HOST); // Connect to 127.0.0.1:6379 as default

// If you want to connect to a different Redis server or port, you can do:
// const client = new Redis({ host: 'some-host', port: some-port });

export const redis = {
	client,
};
