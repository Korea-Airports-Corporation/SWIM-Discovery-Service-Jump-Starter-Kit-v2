import { PipeTransform, BadRequestException } from '@nestjs/common';

export class QueryParamServiceCategoryValidationPipe implements PipeTransform {
  readonly allowed =  [
    'core',
    'aeronautical',
    'flight',
    'infrastructure',
    'surveillance',
    'weather',
    'world-features',
    'discovery',
    'mediation',
    'messaging',
    'security',
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
