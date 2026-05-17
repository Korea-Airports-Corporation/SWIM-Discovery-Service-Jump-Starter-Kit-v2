import { DiscoveryServiceProviderDto } from '../dto/discovery-service-provider.dto';
import { DiscoveryServiceProviderContactDto } from '../dto/discovery-service-provider-contact.dto';

interface IDiscoveryServiceProviderFactory {
    setId(value: string) : void;
    setName(value: string) : void;
    setDescription(value: string) : void;
    setWebsite(value: string) : void;
    setPointOfContact(value: DiscoveryServiceProviderContactDto[]) : void;
    getDiscoveryServiceProviderData() : DiscoveryServiceProviderDto;
  }

export class DiscoveryServiceProviderFactory implements IDiscoveryServiceProviderFactory {
    private _id: string;
    private _name: string;
    private _description: string;
    private _website: string;
    private _pointOfContact: DiscoveryServiceProviderContactDto[];

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
    setWebsite(value) : void {
        this._website = value;
    };
    setPointOfContact(value) : void {
        this._pointOfContact = Array.isArray(value)
            ? value
                .filter(contact => contact && typeof contact === 'object')
                .map(contact => this.toPointOfContact(contact))
                .filter(contact => this.hasContent(contact))
            : [];
    };

    setContact(value: DiscoveryServiceProviderContactDto) : void {
        this._pointOfContact = value ? [this.toPointOfContact(value)] : [];
    }

    getProviderData() : DiscoveryServiceProviderDto {
        return this.getDiscoveryServiceProviderData();
    }

    getDiscoveryServiceProviderData() : DiscoveryServiceProviderDto {
        const data = {
            id: this._id,
            name: this._name,
            description: this._description,
            "website": this._website,
            "point-of-contact": this._pointOfContact
        }

        return data; 
    };

    private toPointOfContact(value: any): DiscoveryServiceProviderContactDto {
        return this.compact({
            name: value.name,
            function: value.function,
            email: value.email
        }) as DiscoveryServiceProviderContactDto;
    }

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
