import { PipeTransform, BadRequestException } from '@nestjs/common';

export class QueryParamAvailabilityStatusValidationPipe implements PipeTransform {
  readonly allowed =  [
    'operational',
    'prospective',
    'retired'
  ]; 

  transform(parms: any) {
    if (parms === undefined) return ''; 
    const values = String(parms)
      .split(/[;,]/)
      .map(value => value.trim().toLowerCase())
      .filter(value => value.length > 0);

    for (const value of values) {
      if (!this.isParamValid(value)) {
        throw new BadRequestException(`Unacceptable Query Parameter`);
      }
    }

    return values.join(';');
  }

  private isParamValid(parms: any) {
    return (this.allowed.indexOf(parms) > -1);
  }
}
