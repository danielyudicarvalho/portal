import prisma from '@/lib/prisma';

export class ChampionshipService {
  /**
   * Update championship statuses based on current time
   */
  static async updateChampionshipStatuses() {
    const now = new Date();

    try {
      // Update UPCOMING championships to ACTIVE
      await prisma.championship.updateMany({
        where: {
          status: 'UPCOMING',
          startTime: {
            lte: now,
          },
          endTime: {
            gt: now,
          },
        },
        data: {
          status: 'ACTIVE',
        },
      });

      // Update ACTIVE championships to COMPLETED
      const completedChampionships = await prisma.championship.findMany({
        where: {
          status: 'ACTIVE',
          endTime: {
            lte: now,
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
            orderBy: {
              bestScore: 'desc',
            },
          },
        },
      });

      // Process each completed championship
      for (const championship of completedChampionships) {
        await this.finalizeChampionship(championship);
      }

      console.log(`Updated ${completedChampionships.length} championships to COMPLETED status`);
    } catch (error) {
      console.error('Error updating championship statuses:', error);
    }
  }

  /**
   * Finalize a championship by calculating final rankings and distributing prizes
   */
  static async finalizeChampionship(championship: any) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update championship status
        await tx.championship.update({
          where: { id: championship.id },
          data: { status: 'COMPLETED' },
        });

        // Calculate prize distribution
        const totalParticipants = championship.participants.length;
        const prizeDistribution = this.calculatePrizeDistribution(
          championship.prizePool,
          totalParticipants
        );

        // Update participant rankings and distribute prizes
        for (let i = 0; i < championship.participants.length; i++) {
          const participant = championship.participants[i];
          const rank = i + 1;
          const prize = prizeDistribution[i] || 0;

          // Update participant record
          await tx.championshipParticipant.update({
            where: { id: participant.id },
            data: {
              finalRank: rank,
              prizeWon: prize,
            },
          });

          // Award prize credits to user
          if (prize > 0) {
            await tx.user.update({
              where: { id: participant.userId },
              data: {
                credits: {
                  increment: prize,
                },
              },
            });

            // Record prize transaction
            await tx.transaction.create({
              data: {
                userId: participant.userId,
                amount: prize,
                type: 'CREDIT_PURCHASE', // Prize winnings
                status: 'COMPLETED',
                description: `Championship prize: ${championship.title} (Rank #${rank})`,
                metadata: {
                  championshipId: championship.id,
                  rank,
                  type: 'championship_prize',
                },
              },
            });
          }
        }
      });

      console.log(`Finalized championship: ${championship.title}`);
    } catch (error) {
      console.error(`Error finalizing championship ${championship.id}:`, error);
    }
  }

  /**
   * Calculate prize distribution based on total prize pool and number of participants
   */
  static calculatePrizeDistribution(totalPrize: number, participantCount: number): number[] {
    if (participantCount === 0) return [];

    const prizes: number[] = new Array(participantCount).fill(0);

    if (participantCount === 1) {
      // Winner takes all
      prizes[0] = totalPrize;
    } else if (participantCount === 2) {
      // 70% to winner, 30% to second
      prizes[0] = Math.floor(totalPrize * 0.7);
      prizes[1] = totalPrize - prizes[0];
    } else if (participantCount >= 3) {
      // 50% to winner, 30% to second, 20% to third
      prizes[0] = Math.floor(totalPrize * 0.5);
      prizes[1] = Math.floor(totalPrize * 0.3);
      prizes[2] = totalPrize - prizes[0] - prizes[1];
    }

    return prizes;
  }

  /**
   * Submit a score for a championship participant
   */
  static async submitChampionshipScore(
    championshipId: string,
    userId: string,
    scoreData: {
      score: number;
      level: number;
      duration?: number;
      metadata?: any;
    }
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify championship is active
        const championship = await tx.championship.findUnique({
          where: { id: championshipId },
          include: {
            participants: {
              where: { userId },
            },
          },
        });

        if (!championship) {
          throw new Error('Championship not found');
        }

        if (championship.status !== 'ACTIVE') {
          throw new Error('Championship is not active');
        }

        const now = new Date();
        if (now < championship.startTime || now > championship.endTime) {
          throw new Error('Championship is not currently running');
        }

        const participant = championship.participants[0];
        if (!participant) {
          throw new Error('User is not participating in this championship');
        }

        // Create game score
        const gameScore = await tx.gameScore.create({
          data: {
            userId,
            gameId: championship.gameId,
            score: scoreData.score,
            level: scoreData.level,
            duration: scoreData.duration,
            metadata: scoreData.metadata,
          },
        });

        // Update participant's best score if this is better
        if (scoreData.score > participant.bestScore) {
          await tx.championshipParticipant.update({
            where: { id: participant.id },
            data: {
              bestScore: scoreData.score,
              bestScoreId: gameScore.id,
            },
          });
        }

        return gameScore;
      });

      return result;
    } catch (error) {
      console.error('Error submitting championship score:', error);
      throw error;
    }
  }

  /**
   * Get championship leaderboard
   */
  static async getChampionshipLeaderboard(championshipId: string) {
    try {
      const participants = await prisma.championshipParticipant.findMany({
        where: { championshipId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          gameScore: {
            select: {
              id: true,
              score: true,
              level: true,
              duration: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { bestScore: 'desc' },
          { joinedAt: 'asc' }, // Tiebreaker: earlier join time
        ],
      });

      return participants;
    } catch (error) {
      console.error('Error fetching championship leaderboard:', error);
      throw error;
    }
  }
}

// Export a function to run the status update (can be called by a cron job)
export async function updateChampionshipStatuses() {
  return ChampionshipService.updateChampionshipStatuses();
}