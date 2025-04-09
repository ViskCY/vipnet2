import { Bot, InlineKeyboard } from "gramio";
import { config } from "./config.ts";
import { startKeyboard } from "./shared/keyboards/index.ts";
import {
  addOrUpdateAdmin,
  getAllAdmins,
  isAdmin,
  Permission,
} from "./services/admin.ts";
import {
  addGroup,
  findGroupById,
  generateInviteLink,
  getAllGroups,
} from "./services/group.ts";
import { sleep } from "bun";

function startMenu(context: any) {
  const welcomeMessage = `
  🏬  *Welcome to VIPNET Marketplace*
  
    • Safety, powered by *Cerberus*
    • Orders, managed by *VIPNET*  
    • Transactions, end-to-end encrypted
    • Tracking, for shipped orders
    • Fast, and reliable 24/7
  
  _Join us today, by clicking the button below!_
  `;
  return context.send(welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: startKeyboard,
  });
}

export const bot = new Bot(config.BOT_TOKEN)
  .command("start", (context) => startMenu(context))
  .onStart(({ info }) => {
    console.log(`✨ Bot ${info.username} was started!`);
  });

bot.callbackQuery("join_groups", async (context) => {
  try {
    const groups = await getAllGroups();
    const keyboard = new InlineKeyboard();

    if (context.message?.id) {
      await context.message.delete();
      await sleep(500);
    }

    groups.forEach((group) => {
      keyboard.text(`${group.name}`, `join_group_${group.groupId}`);
      keyboard.row();
    });

    return context.send(
      "🎯 Select one of the following groups. \n\n🗺️ *Note:*\n• This link is for one-time use only.\n• It will expire in 10 minutes.",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (error) {
    console.error("Error fetching groups:", error);
    return context.send(
      "⚠️ Sorry, I couldn't load the groups. Please try again later."
    );
  }
});

bot.callbackQuery(/join_group_(-\d+)/, async (context) => {
  const callbackData = context.queryPayload;
  const groupId = Number.parseInt(
    typeof callbackData === "string"
      ? callbackData.split("_").pop() || "0"
      : "0"
  );

  try {
    const group = await findGroupById(groupId);

    if (!group) {
      return context.send("⚠️ Group not found. Please try again.");
    }

    if (context.message?.id) {
      await context.message.delete();
      await sleep(500);
    }

    const loadingMessage = await context.send(`⏳ Generating invite link...`);
    await sleep(500);

    const result = await generateInviteLink(
      bot,
      Number(group.groupId),
      group.name
    );

    if (result.error || !result.link) {
      return context.send(
        "⚠️ Sorry, I couldn't generate an invite link for this group. Please try again later."
      );
    }
    const keyboard = new InlineKeyboard()
      .url("🚀 Join Group", result.link)
      .row()
      .text("🔙 Back to Menu", "back_to_menu");

    context.send(`🎯 *Link ready for ${group.name}:*\n\n ${result.link}\n\n`, {
      parse_mode: "Markdown",
      link_preview_options: {
        is_disabled: true,
      },
      reply_markup: keyboard,
    });
    if (loadingMessage?.id) {
      await sleep(250);
      await loadingMessage.delete();
    }
  } catch (error) {
    console.error("Error generating invite link:", error);
    return context.send("⚠️ An error occurred. Please try again later.");
  }
});

bot.callbackQuery("back_to_menu", async (context) => {
  if (context.message?.id) {
    await context.message.delete();
    await sleep(500);
  }
  startMenu(context);
});

bot.command("init_group", async (context) => {
  if (!context.from || !(await isAdmin(context.from.id, Permission.prime))) {
    return context.send("⚠️ You don't have permission to use this command.");
  }

  if (context.chat.type !== "group" && context.chat.type !== "supergroup") {
    return context.send("⚠️ This command must be run in a group chat.");
  }

  const groupId = context.chat.id;
  const groupName = context.chat.title || "Unknown Group";

  try {
    const existingGroup = await findGroupById(groupId);

    if (existingGroup) {
      return context.send(
        `⚠️ This group is already registered as "${existingGroup.name}".`
      );
    }

    await addGroup(groupId, groupName);

    context.send(`⚠️ Initialising bot...`);
    sleep(5000);
    return context.send(`
      ✅ Database initalised
      ✅ Security bot config loaded
      ✅ Creberus guard detected
      ✅ Permisssons loaded

      ✅ Group "${groupName}" has been added successfully!
      `);
  } catch (error) {
    console.error("Error adding group:", error);
    return context.send("⚠️ Failed to add group. Check the logs for details.");
  }
});

bot.command("add_admin", async (context) => {
  if (!context.from || !(await isAdmin(context.from.id, Permission.mng))) {
    return context.send("⚠️ Only managers can add new admins.");
  }

  const args = context.text?.split(" ").slice(1) || [];
  if (args.length < 2) {
    return context.send(
      "⚠️ Usage: /add_admin @username|userId permission\nPermissions: mng, prime, or mod"
    );
  }

  const userIdentifier = args[0];
  const permissionInput = args[1]?.toLowerCase() ?? "";

  if (!Object.keys(Permission).includes(permissionInput)) {
    return context.send("⚠️ Invalid permission. Use: mng, prime, or mod");
  }

  const permission = permissionInput as keyof typeof Permission;

  try {
    let userId: number | null = null;
    let username: string | null = null;

    if (userIdentifier && /^\d+$/.test(userIdentifier)) {
      userId = Number.parseInt(userIdentifier);
      try {
        const chatMember = await bot.api.getChatMember({
          chat_id: context.chat.id,
          user_id: userId,
        });
        username = chatMember.user.username || null;
      } catch (error) {
        console.log("Couldn't fetch username for ID, continuing with just ID");
      }
    } else {
      const cleanUsername = userIdentifier?.replace(/^@/, "") ?? "";
      username = cleanUsername;

      return context.send(
        "⚠️ Adding by username is not supported. Please use the user's ID instead."
      );
    }

    if (!userId) {
      return context.send(
        "⚠️ Couldn't identify the user. Please use a valid user ID."
      );
    }
    await addOrUpdateAdmin(userId, username, Permission[permission]);

    return context.send(
      `✅ ${
        username ? `@${username}` : `ID: ${userId}`
      } has been added/updated as an admin with ${permission} permission.`
    );
  } catch (error) {
    console.error("Error adding admin:", error);
    return context.send("⚠️ Failed to add admin. Check the logs for details.");
  }
});

bot.command("list_groups", async (context) => {
  if (!context.from || !(await isAdmin(context.from.id))) {
    return context.send("⚠️ You don't have permission to use this command.");
  }

  try {
    const groups = await getAllGroups();

    if (groups.length === 0) {
      return context.send("No groups have been added yet.");
    }

    const groupList = groups
      .map((group) => `• ${group.name} (ID: ${group.groupId})`)
      .join("\n");
    return context.send(`📋 *Registered Groups:*\n\n${groupList}`, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error listing groups:", error);
    return context.send(
      "⚠️ Failed to list groups. Check the logs for details."
    );
  }
});

bot.command("list_admins", async (context) => {
  if (!context.from || !(await isAdmin(context.from.id))) {
    return context.send("⚠️ You don't have permission to use this command.");
  }

  try {
    const admins = await getAllAdmins();

    if (admins.length === 0) {
      return context.send("No admins have been added yet.");
    }

    const adminList = admins
      .map(
        (admin) =>
          `• ${
            admin.username ? `@${admin.username}` : `User ID: ${admin.userId}`
          } - ${admin.permission}`
      )
      .join("\n");

    return context.send(`👥 *Bot Administrators:*\n\n${adminList}`, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error listing admins:", error);
    return context.send(
      "⚠️ Failed to list admins. Check the logs for details."
    );
  }
});
