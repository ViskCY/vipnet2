import { InlineKeyboard } from "gramio";

export const startKeyboard = new InlineKeyboard()
  .text("🔒 Marketplace (LOGED OUT)", "open_marketplace")
  .row()
  .url("📩 Support", "https://t.me/notvipdizzy")
  .text("🌐 Join Groups", "join_groups");
