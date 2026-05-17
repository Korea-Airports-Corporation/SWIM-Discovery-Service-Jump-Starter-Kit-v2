import { PipeTransform, NotAcceptableException, BadRequestException } from '@nestjs/common';

export class HeaderValidationPipe implements PipeTransform {
  readonly allowed = 'application/json';

  transform(headers: any) {
    if (!this.isHeaderValid(headers.accept)) {
      throw new NotAcceptableException(`Only application/json is acceptable`);
    }
    const acceptLanguage = headers['accept-language'];
    if (!acceptLanguage) {
      throw new BadRequestException(`Missing required Accept-Language header`);
    }
    if (acceptLanguage && !acceptLanguage.toLowerCase().includes('en')) {
      throw new NotAcceptableException(`Only English (en) language is supported for responses`);
    }

    return true;
  }

  private isHeaderValid(accept: any) {
    if (accept === this.allowed) return true;
    else return false; 
  }
}
