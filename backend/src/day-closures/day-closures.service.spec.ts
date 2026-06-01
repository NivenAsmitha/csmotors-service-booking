import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { stubProvider } from '../testing/stub-provider';
import { DayClosuresService } from './day-closures.service';

describe('DayClosuresService', () => {
  let service: DayClosuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DayClosuresService,
        stubProvider(PrismaService),
        stubProvider(AuditService),
      ],
    }).compile();

    service = module.get<DayClosuresService>(DayClosuresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
