import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  domain: process.env.DOMAIN ?? "http://localhost",
};
