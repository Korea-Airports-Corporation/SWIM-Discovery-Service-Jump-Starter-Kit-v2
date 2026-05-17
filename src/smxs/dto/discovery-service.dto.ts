import { DiscoveryServiceProviderDto } from './discovery-service-provider.dto';
import { ServiceLinkDto } from './utility.dto';

export class DiscoveryServiceDto {
  id: string;
  name: string;
  description?: string;
  version: string;
  provider: DiscoveryServiceProviderDto;
  references: {
    links: ServiceLinkDto[];
  };
}
