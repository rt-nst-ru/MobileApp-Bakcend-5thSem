import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { MessageService } from './message.service';
import {
  GetMessagesDto,
  CreateMessageDto,
  MessageResponseDto,
  PaginatedMessagesResponseDto,
} from './dto/message.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('messages')
@ApiSecurity('basic-auth')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated messages',
    description:
      'Fetches messages for a conversation using cursor-based pagination. ' +
      'First call: omit from_message_cursor. ' +
      'Subsequent calls: pass the returned nextCursor to load older messages.',
  })
  @ApiQuery({
    name: 'conversation_id',
    description: 'MongoDB ObjectId of the target conversation',
    example: '64b8f9e2c4a3b12d4e5f0001',
  })
  @ApiQuery({
    name: 'from_message_cursor',
    required: false,
    description: 'ObjectId of the last fetched message. Omit for the first page.',
    example: '64b8f9e2c4a3b12d4e5f1234',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated messages',
    type: PaginatedMessagesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Authorization header' })
  @ApiResponse({ status: 404, description: 'Cursor message not found' })
  getMessages(@Query() query: GetMessagesDto) {
    return this.messageService.getMessages(
      query.conversation_id,
      query.from_message_cursor,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Creates a new message in the specified conversation. ' +
      'The sender is identified from the `Authorization: Basic <username>:<password>` header — ' +
      'no sender_id needed in the body. ' +
      'Delivery/read status is automatically initialized for all participants.',
  })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Message created',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Authorization header' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  createMessage(@Body() body: CreateMessageDto, @CurrentUser() user: any) {
    return this.messageService.createMessage(body, user.id);
  }
}
