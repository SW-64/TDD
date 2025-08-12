import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { UserPoint } from 'src/point/point.model';

/**
 * 해당 Table 클래스는 변경하지 않고 공개된 API 만을 사용해 데이터를 제어합니다.
 */
@Injectable()
export class UserPointTable {
  private readonly table: Map<number, UserPoint> = new Map();

  selectById(id: number): Promise<UserPoint> {
    this.isValidId(id);
    return new Promise((r) =>
      setTimeout(() => {
        if (!this.table.has(id)) {
          // 최초 삽입 시점에만 updateMillis를 생성
          this.table.set(id, { id, point: 0, updateMillis: Date.now() });
        }
        r(this.table.get(id));
      }, randomInt(200)),
    );
  }

  insertOrUpdate(id: number, amount: number): Promise<UserPoint> {
    this.isValidId(id);
    return new Promise((r) =>
      setTimeout(() => {
        console.log(`포인트 : ${amount}`);
        const userPoint = { id: id, point: amount, updateMillis: Date.now() };
        this.table.set(id, userPoint);
        r(userPoint);
      }, randomInt(300)),
    );
  }

  private isValidId(id: number) {
    if (Number.isInteger(id) && id > 0) return;
    throw new Error('올바르지 않은 ID 값 입니다.');
  }
}
