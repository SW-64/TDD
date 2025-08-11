import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { ConflictException } from '@nestjs/common';
// MockUserPointTable
class MockUserPointTable {
  private data = new Map<
    number,
    { id: number; point: number; updateMillis: number }
  >();

  async selectById(userId: number) {
    if (!this.data.has(userId)) {
      this.data.set(userId, { id: userId, point: 0, updateMillis: Date.now() });
    }
    return this.data.get(userId);
  }

  async insertOrUpdate(userId: number, point: number) {
    const now = Date.now();
    this.data.set(userId, { id: userId, point, updateMillis: now });
    return this.data.get(userId);
  }
}

// MockPointHistoryTable
class MockPointHistoryTable {
  private data = new Map<number, any[]>();

  async selectAllByUserId(userId: number) {
    return this.data.get(userId) || [];
  }

  async insert(
    userId: number,
    amount: number,
    type: number,
    timestamp: number,
  ) {
    if (!this.data.has(userId)) {
      this.data.set(userId, []);
    }
    const history = { userId, amount, type, timestamp };
    this.data.get(userId).push(history);
    return history;
  }
}
describe('PointController', () => {
  let controller: PointController;
  let userDb: MockUserPointTable;
  let historyDb: MockPointHistoryTable;

  beforeEach(async () => {
    userDb = new MockUserPointTable();
    historyDb = new MockPointHistoryTable();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        { provide: UserPointTable, useValue: userDb },
        { provide: PointHistoryTable, useValue: historyDb },
      ],
    }).compile();

    controller = module.get<PointController>(PointController);
  });

  it('0원에서 1000원 충전 시, 1000원으로 증가해야 한다', async () => {
    // Given : 유저 1이 0원을 갖고 있는 상태
    await controller.charge('1', { amount: 0 });

    // When: 포인트 1000원 충전
    const result = await controller.charge('1', { amount: 1000 });

    // Then: point가 1000원이 되어야 함
    expect(result.point).toBe(1000);
  });

  it('잔액이 부족할 경우 에러 반환', async () => {
    // Given: 유저 1이 초기 포인트 500원 상태
    await controller.charge('1', { amount: 500 });

    // When & Then: 1500원 사용 시 ConflictException 발생
    await expect(controller.use('1', { amount: 1500 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('1500원에서 1000원을 사용 시, 500원이 남아야 한다.', async () => {
    // Given: 유저 1이 초기 포인트 1500원 상태
    await controller.charge('1', { amount: 1500 });

    // When: 유저 1이 포인트 1000원 사용
    const result = await controller.use('1', { amount: 1000 });

    // Then: 남는 point가 500원이 되어야 함
    expect(result.point).toBe(500);
  });

  it('유저의 현재 포인트를 조회할 수 있어야 한다', async () => {
    // Given: 유저 1이 1000포인트를 갖고 있는 상태
    await controller.charge('1', { amount: 1000 });

    // When: 유저 1의 포인트 조회 API 호출
    const result = await controller.point('1');

    // Then: 조회 결과가 1000포인트여야 함
    expect(result.point).toBe(1000);
  });

  it('유저의 이용 내역을 조회할 수 있어야 한다', async () => {
    // Given: 유저 1이 포인트를 충전하고 사용한 기록이 있는 상태
    // 유저 1이 포인트 1000원을 충전하고, 300원을 사용한 상태
    await controller.charge('1', { amount: 1000 });
    await controller.use('1', { amount: 300 });

    // When: 이용 내역 조회 API 호출
    const result = await controller.history('1');

    // Then: 반환된 배열 길이와 각 항목 내용 검증
    // type 0은 충전, type 1은 사용을 의미
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ amount: 1000, type: 0 });
    expect(result[1]).toMatchObject({ amount: 300, type: 1 });
  });
});
