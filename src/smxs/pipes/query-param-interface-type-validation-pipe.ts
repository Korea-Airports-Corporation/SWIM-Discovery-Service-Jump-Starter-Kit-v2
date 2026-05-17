import { PipeTransform, BadRequestException } from '@nestjs/common';

export class QueryParamInterfaceTypeValidationPipe implements PipeTransform {
  readonly allowed =  [
    'message-oriented',
    'method-oriented',
    'resource-oriented',
  ]; 

  transform(parms: any) {
    if (parms === undefined) return ''; 
    const values = String(parms)
      .split(/[;,]/)
      .map(value => value.trim().toLowerCase().replace(/_/g, '-'))
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
