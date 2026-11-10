import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/message.dto';
import { colorizeName } from '../common/color.util';
import { FILE_SELECT, toFileResponse } from '../file/file.service';

const PAGE_SIZE = 20;

/** The message fields returned by the API, including the attachment's details (never its contents). */
const MESSAGE_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  senderId: true,
  conversationId: true,
  status: true,
  file: { select: FILE_SELECT },
} satisfies Prisma.MessageSelect;

/** Adds `type`: TEXT for plain messages, otherwise IMAGE or FILE from the attachment. */
function toMessageResponse({ file, ...message }: Prisma.MessageGetPayload<{ select: typeof MESSAGE_SELECT }>) {
  return {
    ...message,
    content: message.content ?? '',
    type: (file?.kind ?? 'TEXT') as 'TEXT' | 'IMAGE' | 'FILE',
    file: file && toFileResponse(file),
  };
}

@Injectable()
export class MessageService {
  private readonly logger = new Logger('Chat');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch messages for a conversation using cursor-based pagination.
   * - No cursor  → 20 most-recent messages.
   * - With cursor → 20 messages older than the cursor message.
   * Returned oldest-first within the page (natural chat order).
   */
  async getMessages(conversationId: string, fromMessageCursor?: string) {
    if (fromMessageCursor) {
      const cursorMessage = await this.prisma.message.findUnique({
        where: { id: fromMessageCursor },
      });
      if (!cursorMessage) {
        throw new NotFoundException(`Cursor message '${fromMessageCursor}' not found`);
      }
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      // Start right after the cursor message, if one was given
      ...(fromMessageCursor && { cursor: { id: fromMessageCursor }, skip: 1 }),
      select: MESSAGE_SELECT,
    });
    const sorted = [...messages].reverse().map(toMessageResponse);

    return {
      data: sorted,
      nextCursor: messages.length === PAGE_SIZE ? messages[messages.length - 1].id : null,
      count: sorted.length,
    };
  }

  /**
   * Create a new message.
   * senderId comes from the authenticated user, not the request body.
   * Builds default status JSON: sender = delivered+read, others = false.
   * Logs interactive message detail with deterministic ANSI user colors.
   */
  async createMessage(dto: CreateMessageDto, senderId: string) {
    // You can only attach a file you uploaded yourself
    if (dto.file_id && !(await this.prisma.file.count({ where: { id: dto.file_id, uploadedBy: senderId } }))) {
      throw new NotFoundException(`File '${dto.file_id}' not found in your uploads`);
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversation_id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation '${dto.conversation_id}' not found`);
    }

    // Fetch participant names explicitly — Prisma MongoDB relation joins are unreliable
    const participants = await this.prisma.user.findMany({
      where: { id: { in: conversation.participants_ids } },
      select: { id: true, name: true },
    });

    const defaultStatus: Record<string, { delivered: boolean; read: boolean }> = {};
    for (const participantId of conversation.participants_ids) {
      defaultStatus[participantId] =
        participantId === senderId
          ? { delivered: true, read: true }
          : { delivered: false, read: false };
    }

    const message = await this.prisma.message.create({
      data: {
        content: dto.content ?? '',
        senderId,
        conversationId: dto.conversation_id,
        status: defaultStatus,
        fileId: dto.file_id ?? null,
      },
      select: MESSAGE_SELECT,
    });
    const response = toMessageResponse(message);

    // ─── Interactive Console Logging ──────────────────────────────────────────
    const isDm = conversation.type === 'DM';

    // Fetch sender separately — sender may not appear in participants lookup if IDs mismatch
    const senderUser = participants.find((u) => u.id === senderId)
      ?? await this.prisma.user.findUnique({ where: { id: senderId }, select: { id: true, name: true } });

    const senderName = senderUser?.name ?? `id:${senderId}`;
    const resolvedSenderId = senderUser?.id ?? senderId;
    const receiverUsers = participants.filter((u) => u.id !== resolvedSenderId);

    const convLabel = isDm
      ? `DM [${participants.map((u) => colorizeName(u.name)).join(', ')}]`
      : conversation.name
        ? `Group "${conversation.name}"`
        : `Group [${participants.map((u) => colorizeName(u.name)).join(', ')}]`;

    const coloredSender = colorizeName(senderName);
    const coloredReceivers =
      receiverUsers.length > 0
        ? receiverUsers.map((u) => colorizeName(u.name)).join(', ')
        : 'None';

    const attachmentLabel = response.file ? `[${response.type} ${response.file.name}] ` : '';

    this.logger.log(
      `\x1b[36m[MSG]\x1b[0m \x1b[1m${convLabel}\x1b[0m │ ${coloredSender} \x1b[33m➔\x1b[0m ${coloredReceivers} │ ${attachmentLabel}"\x1b[37m${response.content}\x1b[0m"`,
    );

    return response;
  }
}
