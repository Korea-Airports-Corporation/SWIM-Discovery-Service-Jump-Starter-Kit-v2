import { Module } from '@nestjs/common';
import { SmxsService } from './smxs.service';
import { SmxsController } from './smxs.controller';
import { ValidationService } from './validation.service';

@Module({
  controllers: [SmxsController],
  providers: [SmxsService, ValidationService],
})
export class SmxsModule {}
