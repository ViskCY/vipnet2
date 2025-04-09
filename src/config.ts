import env from "env-var"

export const config = {
  NODE_ENV: env
    .get("NODE_ENV")
    .default("development")
    .asEnum(["production", "test", "development"]),
  BOT_TOKEN: env.get("BOT_TOKEN").required().asString(),

  DATABASE_URL: env.get("DATABASE_URL").required().asString(),
  POSTHOG_API_KEY: env.get("POSTHOG_API_KEY").default("it's a secret").asString(),
  POSTHOG_HOST: env.get("POSTHOG_HOST").default("localhost").asString(),
  LOCK_STORE: env.get("LOCK_STORE").default("memory").asEnum(["memory"]),
}
