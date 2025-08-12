import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Patch,
  ValidationPipe,
} from '@nestjs/common';
import { PointHistory, TransactionType, UserPoint } from './point.model';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { PointBody as PointDto } from './point.dto';

@Controller('/point')
export class PointController {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {}

  /**
   * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
   */
  @Get(':id')
  async point(@Param('id') id): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const user = await this.userDb.selectById(userId);
    console.log(user);
    return { id: userId, point: user.point, updateMillis: user.updateMillis };
  }

  /**
   * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
   */
  @Get(':id/histories')
  async history(@Param('id') id): Promise<PointHistory[]> {
    const userId = Number.parseInt(id);
    const userPointHistory = await this.historyDb.selectAllByUserId(userId);
    return userPointHistory;
  }

  /**
   * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
   */
  @Patch(':id/charge')
  async charge(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    const user = await this.userDb.selectById(userId);
    console.log(user);
    // 낙관적 락 체크
    if (user.updateMillis !== pointDto.prevUpdateMillis) {
      throw new ConflictException(
        '다른 요청에 의해 이미 변경된 데이터입니다. 다시 시도해주세요.',
      );
    }
    const chargedPoint = user.point + amount;

    const updatedUser = await this.userDb.insertOrUpdate(userId, chargedPoint);
    await this.historyDb.insert(
      userId,
      amount,
      TransactionType.CHARGE,
      updatedUser.updateMillis,
    );
    return {
      id: userId,
      point: chargedPoint,
      updateMillis: updatedUser.updateMillis,
    };
  }

  /**
   * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
   */
  @Patch(':id/use')
  async use(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    const user = await this.userDb.selectById(userId);

    const remainPoint = user.point - amount;
    if (remainPoint < 0) {
      throw new ConflictException('포인트가 부족합니다.');
    }

    const updatedPointHistory = await this.historyDb.insert(
      userId,
      amount,
      TransactionType.USE,
      Date.now(),
    );

    await this.userDb.insertOrUpdate(userId, remainPoint);
    return { id: userId, point: remainPoint, updateMillis: Date.now() };
  }
}
