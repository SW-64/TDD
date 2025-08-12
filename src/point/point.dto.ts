import { IsInt } from 'class-validator';

export class PointBody {
  @IsInt()
  amount: number;

  @IsInt()
  prevUpdateMillis: number;
}
