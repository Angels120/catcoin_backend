import { MyContext } from "../types";
import { Composer } from "grammy";
import { MenuMiddleware } from "grammy-inline-menu";
import * as commands from "./commands";
import * as admin from "./admin";
import isAdmin from "../middlewares/admin";
export const bot = new Composer<MyContext>();

const adminMiddleware = new MenuMiddleware("admin/", admin.menu);
bot.command("admin", isAdmin, async (ctx) =>
	adminMiddleware.replyToContext(ctx)
);
bot.use(commands.bot);

bot.use(admin.bot);
bot.use(adminMiddleware);
