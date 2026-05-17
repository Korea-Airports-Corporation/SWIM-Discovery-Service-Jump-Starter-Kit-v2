import { DiscoveryServiceProviderContactDto } from '../dto/discovery-service-provider-contact.dto';

export class DiscoveryServiceProviderDto {
  id: string;
  name: string;
  description: string;
  "website": string;
  "point-of-contact": DiscoveryServiceProviderContactDto[];
}
