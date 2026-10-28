import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Fixed Bot Users ──────────────────────────────────────────────────────────
const BOT_USERS = [
  { name: 'FactBot Alpha',   phone: 'BOT_001' },
  { name: 'FactBot Beta',    phone: 'BOT_002' },
  { name: 'FactBot Gamma',   phone: 'BOT_003' },
  { name: 'FactBot Delta',   phone: 'BOT_004' },
  { name: 'FactBot Epsilon', phone: 'BOT_005' },
];

const BOT_NAMES = new Set(BOT_USERS.map((u) => u.name));

// ─── Random Facts Pool ────────────────────────────────────────────────────────
const FACTS = [
  "Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs that was still edible.",
  "A group of flamingos is called a 'flamboyance'.",
  "The shortest war in history lasted 38–45 minutes — between Britain and Zanzibar in 1896.",
  "Octopuses have three hearts, nine brains, and blue blood.",
  "Bananas are berries, but strawberries are not.",
  "The Eiffel Tower grows about 15 cm taller in summer due to thermal expansion.",
  "A day on Venus is longer than a year on Venus.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "There are more possible iterations of a game of chess than atoms in the observable universe.",
  "The inventor of the frisbee was turned into a frisbee after he died (he was cremated and his ashes mixed into frisbees).",
  "Wombats produce cube-shaped poop — the only known animal to do so.",
  "The average person walks about 100,000 miles in their lifetime — roughly 4 laps around the Earth.",
  "Sea otters hold hands while sleeping so they don't drift apart. This is called a 'raft'.",
  "Crows can recognise and remember human faces, and will hold grudges.",
  "The unicorn is the national animal of Scotland.",
  "Oxford University is older than the Aztec Empire.",
  "The total weight of all ants on Earth roughly equals the total weight of all humans.",
  "A bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "Sharks are older than trees — they've existed for over 450 million years.",
  "There's a planet made mostly of diamond — 55 Cancri e, twice Earth's size.",
  "Cats can't taste sweetness — they lack the taste receptor for it.",
  "The average cloud weighs about 500,000 kg.",
  "A group of owls is called a parliament.",
  "A crocodile cannot stick its tongue out.",
  "Sloths can hold their breath longer than dolphins — up to 40 minutes.",
  "Butterflies taste with their feet.",
  "Polar bear skin is actually black, and their fur is hollow and transparent.",
  "A cloud can weigh more than a million pounds.",
  "It rains diamonds on Saturn and Jupiter.",
  "The heart of a blue whale is the size of a small car.",
  "A snail can sleep for three years.",
  "Elephants are the only animals that can't jump.",
  "A rhinoceros' horn is made of compacted hair.",
  "Nutmeg is extremely poisonous if injected intravenously.",
  "You can't hum while holding your nose closed.",
  "A single strand of Spaghetti is called a 'Spaghetto'.",
  "The world's oldest known living land animal is Jonathan the tortoise, hatched in 1832.",
  "Pineapples take about two years to grow.",
  "Rabbits and parrots can see behind themselves without moving their heads.",
  "The dot over the letter 'i' and 'j' is called a tittle.",
];

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private timer: NodeJS.Timeout | null = null;
  private botUserIds: string[] = [];
  private factIndex = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Bot simulation enabled (BOT_MODE=true)');
    await this.seedBotUsers();

    // Start 10-second ticker
    this.timer = setInterval(() => {
      this.sendBotMessages();
    }, 10_000);

    this.logger.log(
      `FactBots active: ${this.botUserIds.length} bots sending facts every 10s to all real users.`,
    );
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.log('Bot simulation stopped.');
    }
  }

  // ─── Seed 5 fixed bot users ──────────────────────────────────────────────────
  private async seedBotUsers() {
    for (const bot of BOT_USERS) {
      let user = await this.prisma.user.findUnique({
        where: { name: bot.name },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            name: bot.name,
            phone: bot.phone,
            bio: 'I am a FactBot 🤖',
            conversationIds: [],
          },
        });
      }
      this.botUserIds.push(user.id);
    }
  }

  // ─── Core loop: every tick, EVERY real user gets a fact from a random bot ───
  private async sendBotMessages() {
    try {
      // Get all real (non-bot) users
      const realUsers = await this.prisma.user.findMany({
        where: {
          name: { notIn: Array.from(BOT_NAMES) },
        },
      });

      if (realUsers.length === 0) {
        this.logger.debug('No real users found yet — skipping bot tick.');
        return;
      }

      this.logger.log('\x1b[35m[BOT]\x1b[0m \x1b[1m🤖 Bot is Chatting...\x1b[0m');

      for (const realUser of realUsers) {
        // Pick an independently random bot for this user
        const botUserId = this.botUserIds[Math.floor(Math.random() * this.botUserIds.length)];

        // Find or create a DM conversation between this bot and this user
        const conversation = await this.findOrCreateDm(botUserId, realUser.id);

        // Pick next fact (cycle)
        const fact = FACTS[this.factIndex % FACTS.length];
        this.factIndex++;

        // Build status payload
        const status: Record<string, { delivered: boolean; read: boolean }> = {
          [botUserId]:   { delivered: true,  read: true  },
          [realUser.id]: { delivered: false, read: false },
        };

        await this.prisma.message.create({
          data: {
            content: fact,
            senderId: botUserId,
            conversationId: conversation.id,
            status,
          },
        });
      }
    } catch (err) {
      this.logger.error('Bot message tick failed:', err?.message ?? err);
    }
  }

  // ─── Find existing DM or create a new one ─────────────────────────────────
  private async findOrCreateDm(userAId: string, userBId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DM',
        participants_ids: {
          hasEvery: [userAId, userBId],
        },
      },
    });

    if (existing) return existing;

    const conversation = await this.prisma.conversation.create({
      data: {
        type: 'DM',
        createdBy: userAId,
        participants_ids: [userAId, userBId],
      },
    });

    // Link conversation to both users
    await this.prisma.user.updateMany({
      where: { id: { in: [userAId, userBId] } },
      data: {
        conversationIds: {
          push: conversation.id,
        },
      },
    });

    return conversation;
  }
}
