import { Test, TestingModule } from '@nestjs/testing';
import { ByBitApiService } from './by-bit-api.service';

describe('ByBitApiService', () => {
  let service: ByBitApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ByBitApiService],
    }).compile();

    service = module.get<ByBitApiService>(ByBitApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
