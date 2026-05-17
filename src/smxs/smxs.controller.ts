import {
    Controller,
    Get,
    Query,
    Header,
    Req,
    Res
  } from '@nestjs/common';
import { HeaderValidationPipe } from './pipes/header-validation.pipe';
import { SmxsService } from './smxs.service';
import { CustromHeader } from './decorator/custom-header.decorator';
import { DiscoveryServiceDto } from './dto/discovery-service.dto';
import { ServicesWrapperDto } from './dto/services-wrapper.dto';
import { ServiceDto } from './dto/service.dto';

import { QueryParamServiceCategoryValidationPipe } from './pipes/query-param-service-cateogry-validation-pipe';
import { QueryParamInterfaceTypeValidationPipe } from './pipes/query-param-interface-type-validation-pipe';
import { QueryParamAvailabilityStatusValidationPipe } from './pipes/query-param-availability-status-validation-pipe';
import { PeersWrapperDto } from './dto/peers-wrapper';

@Controller('smxs/v2/')
export class SmxsController {
constructor(private readonly appService: SmxsService) {}

    private getBaseUrl(req: any): string {
        const forwardedProto = req.headers['x-forwarded-proto'];
        const forwardedHost = req.headers['x-forwarded-host'];
        const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || 'http';
        const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host;
        return `${protocol}://${host}/smxs/v2`;
    }

    /**
     * Retrieves the instance description of the Discovery Service, providing core 
     * metadata, operation mappings, and point-of-contact details.
     * 
     * Implements Section 3.1 & 4.1 "GetDiscoveryService" 
     * Ref: SDS Specification 2.0.0 (Page 14)
     */
    @Get('discovery-service')
    @Header('Cache-Control', 'public, max-age=3600')
    @Header('Content-Type', 'application/json')
    @Header('Content-Language', 'en')
    getDiscoveryService(
        @Req() req: any,
        @CustromHeader(HeaderValidationPipe) _headers:any
    ): Promise<DiscoveryServiceDto> {
        return this.appService.getDiscoveryService(this.getBaseUrl(req));
    }

    /**
     * Retrieves a collection of references to other related discovery services (Peers),
     * enabling distributed discovery service connectivity via HATEOAS references.
     * 
     * Implements Section 4.2 "GetPeers" 
     * Ref: SDS Specification 2.0.0 (Page 16)
     */
    @Get('peers')
    @Header('Cache-Control', 'public, max-age=3600')
    @Header('Content-Type', 'application/json')
    @Header('Content-Language', 'en')
    getPeers(
        @Req() req: any,
        @CustromHeader(HeaderValidationPipe) _headers:any
    ): Promise<PeersWrapperDto> {
        return this.appService.getPeers(this.getBaseUrl(req));
    }

    /**
     * Retrieves an index of SWIM service descriptions offered by this SDS proxy.
     * Clients can filter by service category, interface type, or availability status.
     * 
     * Implements Section 4.3 "GetServices" 
     * Ref: SDS Specification 2.0.0 (Page 18)
     */
    @Get('services')
    @Header('Cache-Control', 'public, max-age=3600')
    @Header('Content-Type', 'application/json')
    @Header('Content-Language', 'en')
    async getServices(
        @Req() req: any,
        @CustromHeader(HeaderValidationPipe) _headers:any,
        @Query('service-category', QueryParamServiceCategoryValidationPipe) serviceCategory : string,
        @Query('interface-type', QueryParamInterfaceTypeValidationPipe) interfaceType : string,
        @Query('availability-status', QueryParamAvailabilityStatusValidationPipe) availabilityStatus : string,
        @Res({ passthrough: true }) res: any
    ): Promise<ServicesWrapperDto> {
        const result = await this.appService.getServices(serviceCategory,interfaceType,availabilityStatus,this.getBaseUrl(req));
        res.header('X-Total-Count', result.services?.length || 0);
        return result;
    }

    /**
     * Retrieves precisely one detailed SWIM service description matching the target ID mapping.
     * 
     * Implements Section 4.4 "GetServiceDescription"
     * Ref: SDS Specification 2.0.0 (Page 21)
     */
    @Get('service-description')
    @Header('Cache-Control', 'public, max-age=3600')
    @Header('Content-Type', 'application/json')
    @Header('Content-Language', 'en')
    async getServiceDescription(
        @Req() req: any,
        @CustromHeader(HeaderValidationPipe) _headers:any,
        @Query('service-id') serviceId: string | string[],
        @Res({ passthrough: true }) res: any
        ): Promise<ServiceDto> {
        const result = await this.appService.getServiceDescription(serviceId, this.getBaseUrl(req));
        res.header('X-Total-Count', 1);
        return result;
    }
}
  
