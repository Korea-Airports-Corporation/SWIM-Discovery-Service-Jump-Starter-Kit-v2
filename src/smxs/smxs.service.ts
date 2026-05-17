import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { ProfileFactory } from './entity/profile.entity';
import { ModelFactory } from './entity/model.entity';
import { GroundingFactory } from './entity/grounding.entity';
import { ServiceFactory } from './entity/service.entity';
import { ValidationService } from './validation.service';
import { PeersFactory } from './entity/peers.entity';
import { DiscoveryServiceFactory } from './entity/discovery-service.entity';
import { DiscoveryServiceProviderFactory } from './entity/discovery-service-provider.entity';
import { DiscoveryServiceProviderContactFactory } from './entity/discovery-service-provider-contact.entity';
import { ServicesFactory } from './entity/services.entity';
import { ServiceDto } from './dto/service.dto';

@Injectable()
export class SmxsService {
  private readonly DEFAULT_BASE_URL = process.env.SDS_BASE_URL || 'http://localhost:8000/smxs/v2';
  private readonly SDS_BASE_URL_TOKEN = '{{SDS_BASE_URL}}';
  private readonly SERVICE_DESCRIPTION_PATH = '/service-description';
  private readonly LEGACY_SERVICE_DESCRIPTION_PATH = '/discovery-service/services/service-description';

  constructor(private readonly validationService: ValidationService) {}

  /**
   * Returns a full SDS 2.0.0 Service Description.
   */
  async getServiceDescription(serviceId: string | string[], baseUrl?: string): Promise<ServiceDto> {
    if (Array.isArray(serviceId)) {
      throw new BadRequestException('Only one service-id query parameter is allowed.');
    }

    if (typeof serviceId !== 'string' || serviceId.trim().length === 0) {
      throw new BadRequestException('service-id query parameter is required.');
    }

    const runtimeBaseUrl = this.getRuntimeBaseUrl(baseUrl);
    const id = serviceId.trim();

    if (id.includes(',')) {
      throw new BadRequestException('service-id query parameter must contain a single value.');
    }

    const servicesData = this.resolveRuntimeUrls(this.readSampleJson('services', 'services.json'), runtimeBaseUrl);
    const services = Array.isArray(servicesData) ? servicesData : [];

    // 1. Normalize ID (supports full service-description URIs and raw service-id values)
    const normalizedId = this.normalizeServiceId(id);
    const normalizedIdUpper = normalizedId.toUpperCase();

    const targetService = services.find(s => {
      if (!s || typeof s !== 'object') return false;
      const targetServiceId = typeof s["service-id"] === 'string' ? s["service-id"] : '';
      const targetName = typeof s.name === 'string' ? s.name : '';

      return (
        targetServiceId.toUpperCase() === normalizedIdUpper ||
        targetName.toUpperCase().includes(normalizedIdUpper)
      );
    });

    if (!targetService) {
      throw new NotFoundException(`Service description not found for ID: ${id}`);
    }

    const s = targetService;
    const p = targetService.profile || {};
    const m = targetService.model || {};
    const g = targetService.grounding || {};

    const smxsFactory = new ServiceFactory();
    
    // 2. Base Service Info
    smxsFactory.setId(typeof s["service-id"] === 'string' ? this.buildServiceDescriptionServiceId(s["service-id"], runtimeBaseUrl) : undefined);
    smxsFactory.setName(s.name);
    smxsFactory.setVersion(s.version);
    smxsFactory.setDescription(s.description);
    smxsFactory.setFilteringAvailable(s['filtering-available']);
    
    // Add Categorizations (Taxonomies)
    if (s.category) smxsFactory.addCategory(s.category, 'category');
    if (m.interface && m.interface.category) smxsFactory.addCategory(m.interface.category, 'interface');
    if (p['service-lifecycle-status']) smxsFactory.addCategory(p['service-lifecycle-status'].status, 'status');

    // 3. Setup ProfileFactory
    const profileFactory = new ProfileFactory();
    if (p.provider) {
      profileFactory.setProviderName(p.provider.name);
      profileFactory.setProviderDescription(p.provider.description);
      profileFactory.setProviderWebsite(p.provider['website']);
      if (p.provider['point-of-contact']) {
        const poc = p.provider['point-of-contact'];
        profileFactory.setProviderPointOfContactName(poc.name);
        profileFactory.setProviderPointOfContactFunction(poc.function);
        profileFactory.setProviderPointOfContactPhoneNumber(poc['phone-number']);
        profileFactory.setProviderPointOfContactEmail(poc.email);
      }
    }
    profileFactory.setGeographicalExtent(p['geographical-extent']);
    profileFactory.setEnvironmentalConstraint(p['environmental-constraint']);
    profileFactory.setQualityOfService(p['quality-of-service']);
    profileFactory.setServiceValidation(p['service-validation']);
    if (p['service-lifecycle-status']) {
      profileFactory.setServiceLifecycleStatus(p['service-lifecycle-status'].status, p['service-lifecycle-status'].date);
    }
    const profile = profileFactory.getProfileData();

    // 4. Setup ModelFactory
    const modelFactory = new ModelFactory();
    if (m.interface) {
      modelFactory.setInterfaceName(m.interface.name);
      modelFactory.setInterfaceDescription(m.interface.description);
      modelFactory.setInterfaceCategory(m.interface.category);
    }
    modelFactory.setDataSpecification(m['data-specification']);
    modelFactory.setResources(m['resource']);
    if (m.operation) {
      modelFactory.setOperationsAndMessages(m.operation, m.message);
    }
    const model = modelFactory.getModelData();

    // 5. Setup GroundingFactory
    const groundingFactory = new GroundingFactory();
    if (g.binding) {
      groundingFactory.setBindingInfo(
        g.binding.name, 
        g.binding.description, 
        g.binding.protocol, 
        g.binding.interface
      );
    }
    if (g.endpoint) {
      groundingFactory.setEndpointInfo(
        g.endpoint.name, 
        g.endpoint.description, 
        g.endpoint['network-address']
      );
    }
    const grounding = groundingFactory.getGroundingData();

    // 6. Final Assembly
    smxsFactory.setProfile(profile);
    smxsFactory.setModel(model);
    smxsFactory.setGrounding(grounding);

    const serviceDescription = smxsFactory.getServiceData();

    // 7. Validation Pipeline
    const schemaPath = path.resolve(__dirname, '../../schema/sds/2.0.0/service-description.json');
    this.validationService.validate(schemaPath, serviceDescription);

    return serviceDescription;
  }

  private normalizeServiceId(value: string): string {
    let normalized = value.trim();

    try {
      normalized = decodeURIComponent(normalized);
    } catch (e) {
      // Keep the original value when it is not URI-encoded.
    }

    normalized = normalized.replace(/\/+$/, '');

    try {
      const url = new URL(normalized);
      const queryServiceId = url.searchParams.get('service-id');
      if (queryServiceId) {
        return this.normalizeServiceId(queryServiceId);
      }

      const pathname = url.pathname.replace(/\/+$/, '');
      const lowerPathname = pathname.toLowerCase();
      if (
        lowerPathname.includes(this.SERVICE_DESCRIPTION_PATH) ||
        lowerPathname.includes(this.LEGACY_SERVICE_DESCRIPTION_PATH)
      ) {
        return pathname.substring(pathname.lastIndexOf('/') + 1);
      }
    } catch (e) {
      const queryMatch = normalized.match(/[?&]service-id=([^&]+)/i);
      if (queryMatch) return this.normalizeServiceId(queryMatch[1]);
    }

    return normalized;
  }

  private buildServiceDescriptionServiceId(serviceId: string, baseUrl: string): string {
    return `${baseUrl}${this.SERVICE_DESCRIPTION_PATH}?service-id=${encodeURIComponent(serviceId)}`;
  }

  private getRuntimeBaseUrl(baseUrl?: string): string {
    return (baseUrl || this.DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private resolveRuntimeUrls(value: any, baseUrl: string): any {
    if (Array.isArray(value)) {
      return value.map(item => this.resolveRuntimeUrls(item, baseUrl));
    }

    if (value && typeof value === 'object') {
      const result: any = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        result[key] = this.resolveRuntimeUrls(nestedValue, baseUrl);
      }
      return result;
    }

    if (typeof value === 'string') {
      return value.split(this.SDS_BASE_URL_TOKEN).join(baseUrl);
    }

    return value;
  }

  private readSampleJson(...segments: string[]): any {
    return JSON.parse(fs.readFileSync(this.resolveSamplePath(...segments), 'utf-8'));
  }

  private resolveSamplePath(...segments: string[]): string {
    const candidates = [
      path.resolve(__dirname, 'sample', ...segments),
      path.resolve(process.cwd(), 'dist', 'smxs', 'sample', ...segments),
      path.resolve(process.cwd(), 'src', 'smxs', 'sample', ...segments),
    ];

    const filePath = candidates.find(candidate => fs.existsSync(candidate));
    if (filePath) return filePath;

    throw new Error(`SDS sample file not found. Tried: ${candidates.join(', ')}`);
  }

  async getDiscoveryService(baseUrl?: string): Promise<any> {
    const runtimeBaseUrl = this.getRuntimeBaseUrl(baseUrl);

    const discoveryServiceData = this.resolveRuntimeUrls(this.readSampleJson('discoveryService', 'discoveryService.json'), runtimeBaseUrl);
    const providerData = this.readSampleJson('discoveryService', 'provider.json');
    const providerContactData = this.readSampleJson('discoveryService', 'providerContact.json');
    const referencesData = this.resolveRuntimeUrls(this.readSampleJson('discoveryService', 'references.json'), runtimeBaseUrl);

    // 1. Point of Contact
    const contactFactory = new DiscoveryServiceProviderContactFactory();
    contactFactory.setName(providerContactData.name);
    contactFactory.setFunction(providerContactData.function);
    contactFactory.setEmail(providerContactData.email);
    const contact = contactFactory.getContactData();

    // 2. Provider
    const providerFactory = new DiscoveryServiceProviderFactory();
    providerFactory.setId(providerData.id);
    providerFactory.setName(providerData.name);
    providerFactory.setDescription(providerData.description);
    providerFactory.setWebsite(providerData.website);
    providerFactory.setContact(contact);
    const provider = providerFactory.getProviderData();

    // 3. Discovery Service
    const discoveryServiceFactory = new DiscoveryServiceFactory();
    discoveryServiceFactory.setId(discoveryServiceData.id);
    discoveryServiceFactory.setName(discoveryServiceData.name);
    discoveryServiceFactory.setDescription(discoveryServiceData.description);
    discoveryServiceFactory.setVersion(discoveryServiceData.version);
    discoveryServiceFactory.setProvider(provider);
    discoveryServiceFactory.setReferences(referencesData);

    const result = discoveryServiceFactory.getDiscoveryServiceData();

    const schemaPath = path.resolve(__dirname, '../../schema/sds/2.0.0/discovery-service.json');
    this.validationService.validate(schemaPath, result);

    return result;
  }

  async getServices(category?: string, interfaceType?: string, status?: string, baseUrl?: string): Promise<any> {
    const runtimeBaseUrl = this.getRuntimeBaseUrl(baseUrl);
    const servicesData = this.resolveRuntimeUrls(this.readSampleJson('services', 'services.json'), runtimeBaseUrl);
    const services = Array.isArray(servicesData) ? servicesData : [];
    const categoryFilters = this.parseFilterValues(category);
    const interfaceTypeFilters = this.parseFilterValues(interfaceType);
    const statusFilters = this.parseFilterValues(status);
    
    // Apply filters based on new nested structure
    let filteredServices = services;
    if (categoryFilters.length > 0) {
      filteredServices = filteredServices.filter(s =>
        s && typeof s === 'object' && categoryFilters.includes(this.normalizeFilterValue(s.category))
      );
    }
    if (interfaceTypeFilters.length > 0) {
      filteredServices = filteredServices.filter(s =>
        s && typeof s === 'object' && s.model && s.model.interface && interfaceTypeFilters.includes(this.normalizeFilterValue(s.model.interface.category))
      );
    }
    if (statusFilters.length > 0) {
      filteredServices = filteredServices.filter(s =>
        s && typeof s === 'object' && s.profile && s.profile['service-lifecycle-status'] && statusFilters.includes(this.normalizeFilterValue(s.profile['service-lifecycle-status'].status))
      );
    }

    // 2. Map to Summary Format using the dedicated ServicesFactory (Standard Pattern)
    const summaries = filteredServices.filter(s => s && typeof s === 'object').map(s => {
      const factory = new ServicesFactory();
      
      factory.setServiceId(typeof s["service-id"] === 'string' ? this.buildServiceDescriptionServiceId(s["service-id"], runtimeBaseUrl) : undefined);
      factory.setName(s.name);
      factory.setVersion(s.version);
      factory.setDescription(s.description);
      
      // Use dedicated methods from ServicesFactory
      if (s.category) {
        factory.setServiceCategory(s.category);
      }
      if (s.model && s.model.interface && s.model.interface.category) {
        factory.setInterfaceType(s.model.interface.category);
      }
      if (s.profile && s.profile['service-lifecycle-status']) {
        factory.setServiceAvailabilityStatus(s.profile['service-lifecycle-status'].status);
      }

      return factory.getServicesData();
    });

    const wrapper = {
      "services": summaries
    };
    
    const schemaPath = path.resolve(__dirname, '../../schema/sds/2.0.0/services.json');
    this.validationService.validate(schemaPath, wrapper);
    
    return wrapper;
  }

  private parseFilterValues(value?: string): string[] {
    if (typeof value !== 'string') return [];

    return Array.from(new Set(
      value
        .split(/[;,]/)
        .map(item => this.normalizeFilterValue(item))
        .filter(item => item.length > 0)
    ));
  }

  private normalizeFilterValue(value: any): string {
    if (typeof value === 'string') {
      return value.trim().toLowerCase().replace(/_/g, '-');
    }

    if (value && typeof value === 'object') {
      if (typeof value.name === 'string' && value.name.trim().length > 0) {
        return value.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
      }

      if (typeof value.id === 'string' && value.id.trim().length > 0) {
        const id = value.id.trim();
        return id.substring(Math.max(id.lastIndexOf('#'), id.lastIndexOf('/')) + 1).toLowerCase().replace(/_/g, '-');
      }
    }

    return '';
  }

  async getPeers(baseUrl?: string): Promise<any> {
    const runtimeBaseUrl = this.getRuntimeBaseUrl(baseUrl);
    const rawPeersData = this.resolveRuntimeUrls(this.readSampleJson('peers', 'peers.json'), runtimeBaseUrl);
    const peersData = Array.isArray(rawPeersData) ? rawPeersData : [];

    const peers = peersData.filter(p => p && typeof p === 'object').map(p => {
      const factory = new PeersFactory();
      factory.setServiceId(p.serviceId);
      factory.setName(p.name);
      factory.setVersion(p.version);
      factory.setDescription(p.description);
      factory.setLinks(p.links);
      return factory.getPeersData();
    });

    const peersWrapper = {
      "peers": peers
    };
    
    const schemaPath = path.resolve(__dirname, '../../schema/sds/2.0.0/peers.json');
    this.validationService.validate(schemaPath, peersWrapper);
    
    return peersWrapper;
  }
}
