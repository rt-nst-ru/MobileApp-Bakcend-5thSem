import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns user profile by ID.
   * Excludes conversationIds and credentials for privacy.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id '${userId}' not found`);
    }

    return user;
  }

  /**
   * Returns all users on the platform.
   * Excludes conversationIds and credentials for privacy.
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        bio: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
