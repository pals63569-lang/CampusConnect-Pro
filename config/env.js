const dotenv = require("dotenv");
const path = require("path");
const { z } = require("zod");

dotenv.config({ path: path.join(__dirname, "../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("3000"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/campusconnect_pro"),
  JWT_SECRET: z.string().default("super_secret_jwt_key_campus_connect_pro_2026"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_SECRET: z.string().default("super_secret_refresh_key_campus_connect_pro_2026"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGIN: z.string().default("*"),

  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().transform((val) => parseInt(val, 10)).optional().default("587"),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@campusconnect.edu"),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Environment validation error:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

const env = parsedEnv.data;

const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  corsOrigin: env.CORS_ORIGIN,

  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
    from: env.EMAIL_FROM,
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
};

module.exports = config;

