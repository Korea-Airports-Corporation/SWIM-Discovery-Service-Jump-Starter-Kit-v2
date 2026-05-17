import { DiscoveryServiceDto } from '../dto/discovery-service.dto';
import { DiscoveryServiceProviderDto } from '../dto/discovery-service-provider.dto';

interface IDiscoveryServiceFactory {
    setId(value: string) : void;
    setName(value: string) : void;
    setDescription(value: string) : void;
    setVersion(value: string) : void;
    setProvider(value: DiscoveryServiceProviderDto) : void;
    setReferences(value: any) : void;
    getDiscoveryServiceData() : DiscoveryServiceDto;
  }

export class DiscoveryServiceFactory implements IDiscoveryServiceFactory {
    private _id: string;
    private _name: string;
    private _description: string;
    private _version: string;
    private _provider: DiscoveryServiceProviderDto;
    private _references: any;

    constructor() {}
    setId(value) : void {
        this._id = value;
    };
    setName(value) : void {
        this._name = value;
    };
    setDescription(value) : void {
        this._description = value;
    };
    setVersion(value) : void {
        this._version = value;
    };
    setProvider(value) : void {
        this._provider = value;
    };
    setReferences(value) : void {
        const links = Array.isArray(value?.links)
            ? value.links
                .filter(link => link && typeof link === 'object')
                .map(link => this.compact({
                    rel: link.rel,
                    href: link.href,
                    title: link.title,
                    type: link.type,
                    language: link.language
                }))
                .filter(link => this.hasContent(link))
            : [];

        this._references = { links };
    };

    getDiscoveryServiceData() : DiscoveryServiceDto {

        const data = {
            id: this._id,
            name: this._name,
            description: this._description,
            version: this._version,
            provider: this._provider,
            references: this._references,
        }

        return data; 
    };

    private compact(value: any): any {
        const result: any = {};
        for (const key of Object.keys(value)) {
            if (value[key] !== undefined && value[key] !== null) {
                result[key] = value[key];
            }
        }
        return result;
    }

    private hasContent(value: any): boolean {
        return value && Object.keys(value).length > 0;
    }

}
