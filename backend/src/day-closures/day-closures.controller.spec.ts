import { Test, TestingModule } from '@nestjs/testing';
import { stubProvider } from '../testing/stub-provider';
import { DayClosuresController } from './day-closures.controller';
import { DayClosuresService } from './day-closures.service';

describe('DayClosuresController', () => {
  let controller: DayClosuresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DayClosuresController],
      providers: [stubProvider(DayClosuresService)],
    }).compile();

    controller = module.get<DayClosuresController>(DayClosuresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
