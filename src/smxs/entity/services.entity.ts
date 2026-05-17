import { ServicesDto } from '../dto/services.dto';
import { Taxonomy } from './../enum/taxonomy.enum';
import { AvailabilityStatus } from '../enum/availability-status';
import { InterfaceType } from '../enum/interface-type';
import { ServiceCategory } from '../enum/service-category';

interface IServicesFactory {
    setServiceId(value: string) : void;
    setName(value: string) : void;
    setVersion(value: string) : void;
    setDescription(value: string) : void;
    setServiceCategory(value: any) : void;
    setServiceAvailabilityStatus(value: any) : void;
    setInterfaceType(value: any) : void;

    getServicesData() : ServicesDto;
  }

export class ServicesFactory implements IServicesFactory {
  
    private _serviceId : string;
    private _name: string;
    private _version: string;
    private _description : string;
    private _categories : any[] = [];

    constructor() {}

    setServiceId(value) : void {
        this._serviceId = value;
    };

    setName(value) : void {
        this._name = value;
    };

    setVersion(value) : void {
        this._version = value;
    };

    setDescription(value) : void {
        this._description = value;
    };

    setServiceCategory(value) : void {
        this.addTaxonomyCategory(value, "SWIM Service Category", Taxonomy.SERVICE_CATEGORY, ServiceCategory);
    };

    setServiceAvailabilityStatus(value) : void {
        this.addTaxonomyCategory(value, "Service Availability Status", Taxonomy.AVAILABILITY_STATUS, AvailabilityStatus);
    };

    setInterfaceType(value) : void {
        this.addTaxonomyCategory(value, "Service Interface Type", Taxonomy.INTERFACE_TYPE, InterfaceType);
    };

    private formatTitle(code: string): string {
        return code.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
    }

    private addTaxonomyCategory(value: any, category: string, taxonomy: string, enumMap: any): void {
        const taxonomyValue = this.buildTaxonomyValue(value, taxonomy, enumMap);
        if (!taxonomyValue) return;

        this._categories.push({
            category,
            links: [
                { 
                    rel: "describedby", 
                    href: taxonomyValue.source,
                    title: category,
                    type: "text/html",
                    language: "en"
                },
                { 
                    rel: "code", 
                    href: taxonomyValue.id,
                    title: taxonomyValue.name,
                    type: "text/html",
                    language: "en"
                }
            ]
        });
    }

    private buildTaxonomyValue(value: any, taxonomy: string, enumMap: any): any | undefined {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const taxonomyValue = this.compact({
                id: value.id,
                name: value.name,
                source: value.source
            });
            if (taxonomyValue.id && taxonomyValue.name && taxonomyValue.source) return taxonomyValue;
        }

        const rawCode = this.extractTaxonomyCode(value);
        if (!rawCode) return undefined;

        const code = enumMap[rawCode.toUpperCase().replace(/-/g, '_')];
        if (!code) return undefined;

        return {
            id: `${taxonomy}#${code}`,
            name: this.formatTitle(code),
            source: taxonomy
        };
    }

    private extractTaxonomyCode(value: any): string | undefined {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim().toLowerCase().replace(/_/g, '-');
        }

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (typeof value.id === 'string' && value.id.trim().length > 0) {
                const id = value.id.trim();
                return id.substring(Math.max(id.lastIndexOf('#'), id.lastIndexOf('/')) + 1).toLowerCase().replace(/_/g, '-');
            }
            if (typeof value.name === 'string' && value.name.trim().length > 0) {
                return value.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
            }
        }

        return undefined;
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
    
    getServicesData() : ServicesDto {
        const data: ServicesDto = {
            "service-id" : this._serviceId ,
            "name": this._name,
            "version": this._version,
            "description" : this._description,
            "categories" : this._categories
        };
      
        return data; 
    };
}
