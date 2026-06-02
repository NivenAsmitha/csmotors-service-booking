import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  const createAuditLog = jest.fn();

  beforeEach(async () => {
    createAuditLog.mockReset();
    createAuditLog.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: createAuditLog,
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('removes sensitive metadata before storing an audit log', async () => {
    await service.log({
      action: 'security.test',
      entity: 'user',
      metadata: {
        otp: '123456',
        jwt: 'header.payload.signature',
        api_key: 'private-key',
        password: 'password',
        nested: {
          access_token: 'token',
          status: 'allowed',
        },
      },
    });

    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        user_id: null,
        action: 'security.test',
        entity: 'user',
        entity_id: null,
        metadata: {
          nested: {
            status: 'allowed',
          },
        },
      },
    });
  });
});
