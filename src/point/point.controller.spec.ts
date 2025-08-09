import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';

describe('PointController', () => {
  let controller: PointController;
  let userDb: UserPointTable;
  let historyDb: PointHistoryTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [UserPointTable, PointHistoryTable],
    }).compile();

    controller = module.get<PointController>(PointController);
    userDb = module.get<UserPointTable>(UserPointTable);
    historyDb = module.get<PointHistoryTable>(PointHistoryTable);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
