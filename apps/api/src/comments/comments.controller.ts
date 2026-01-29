import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { CommentDto } from '@servicedesk/shared';
import { CreateCommentRequest } from './dto/create-comment.request';
import { CommentsService } from './comments.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUserDto } from '@servicedesk/shared';

@ApiTags('comments')
@Controller('tickets/:ticketId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiParam({ name: 'ticketId', description: 'Ticket id.' })
  @ApiOkResponse({ description: 'List comments.' })
  getComments(@Param('ticketId') ticketId: string): CommentDto[] {
    return this.commentsService.getComments(ticketId);
  }

  @Post()
  @ApiParam({ name: 'ticketId', description: 'Ticket id.' })
  @ApiBody({ type: CreateCommentRequest })
  @ApiCreatedResponse({ description: 'Create comment.' })
  addComment(
    @Param('ticketId') ticketId: string,
    @Body() body: CreateCommentRequest,
    @CurrentUser() currentUser: AuthUserDto,
  ): CommentDto {
    return this.commentsService.addComment(ticketId, currentUser.id, body);
  }
}
