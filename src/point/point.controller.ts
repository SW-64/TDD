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
    const getUser = await this.userDb.selectById(userId);
    return { id: userId, point: getUser.point, updateMillis: Date.now() };
  }

  /**
   * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
   */
  @Get(':id/histories')
  async history(@Param('id') id): Promise<PointHistory[]> {
    const userId = Number.parseInt(id);
    const getUserPointHistory = await this.historyDb.selectAllByUserId(userId);
    return getUserPointHistory;
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
    const getUser = await this.userDb.selectById(userId);
    const updatedPointHistory = await this.historyDb.insert(
      userId,
      amount,
      TransactionType.CHARGE,
      Date.now(),
    );

    const chargedPoint = getUser.point + amount;
    await this.userDb.insertOrUpdate(userId, chargedPoint);
    return { id: userId, point: chargedPoint, updateMillis: Date.now() };
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
    const getUser = await this.userDb.selectById(userId);

    const usedPoint = getUser.point - amount;
    if (usedPoint < 0) {
      throw new ConflictException('포인트가 부족합니다.');
    }

    const updatedPointHistory = await this.historyDb.insert(
      userId,
      amount,
      TransactionType.USE,
      Date.now(),
    );

    await this.userDb.insertOrUpdate(userId, usedPoint);
    return { id: userId, point: usedPoint, updateMillis: Date.now() };
  }
}
