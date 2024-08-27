import { Test, TestingModule } from '@nestjs/testing';
import { CustomeMailerService } from './mailer.service';

describe('CustomeMailerService', () => {
  let service: CustomeMailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomeMailerService],
    }).compile();

    service = module.get<CustomeMailerService>(CustomeMailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
