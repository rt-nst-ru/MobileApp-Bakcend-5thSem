import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiBody,
} from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import {
  ConversationResponseDto,
  CreateConversationDto,
} from './dto/conversation.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('conversations')
@ApiSecurity('basic-auth')
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @ApiOperation({
    summary: 'List my conversations',
    description:
      'Returns all conversations the authenticated user participates in, ' +
      'sorted by createdAt descending (newest first). ' +
      'User is identified from the `Authorization: Basic <username>:<password>` header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of conversations returned successfully',
    type: [ConversationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Authorization header' })
  getConversations(@CurrentUser() user: any) {
    return this.conversationService.getUserConversations(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create or find a conversation',
    description:
      'Creates a new DM or Group conversation. The caller is automatically added to participants. ' +
      'For DMs, if a conversation between the two users already exists, it is returned instead of creating a duplicate.',
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: 201,
    description: 'Conversation created or found',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or invalid participants' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Authorization header' })
  @ApiResponse({ status: 404, description: 'Recipient user not found' })
  createConversation(
    @Body() body: CreateConversationDto,
    @CurrentUser() user: any,
  ) {
    return this.conversationService.createConversation(body, user.id);
  }
}
