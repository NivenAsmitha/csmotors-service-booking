import { Test, TestingModule } from '@nestjs/testing';
import { stubProvider } from '../testing/stub-provider';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

describe('SlotsController', () => {
  let controller: SlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlotsController],
      providers: [stubProvider(SlotsService)],
    }).compile();

    controller = module.get<SlotsController>(SlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
