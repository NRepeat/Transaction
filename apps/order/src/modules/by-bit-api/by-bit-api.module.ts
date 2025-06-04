import { Module } from '@nestjs/common';
import { ByBitApiService } from './by-bit-api.service';
import { UtilsModule } from '@app/common';

@Module({
  imports: [UtilsModule],
  providers: [ByBitApiService],
  exports: [ByBitApiService],
})
export class ByBitApiModule {}
