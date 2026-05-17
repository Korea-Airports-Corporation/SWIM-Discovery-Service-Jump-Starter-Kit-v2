import { ProfileDto } from './../dto/profile.dto';
import { ModelDto } from '../dto/model.dto';
import { GroundingDto } from '../dto/grounding.dto';
import { ServiceDto } from '../dto/service.dto';
import { Taxonomy } from './../enum/taxonomy.enum';
import { ServiceCategory } from './../enum/service-category';
import { AvailabilityStatus } from './../enum/availability-status';
import { InterfaceType } from './../enum/interface-type';

interface IServiceFactory {
    setId(value: string) : void;
    setName(value: string) : void;
    setVersion(value: string) : void;
    setDescription(value: string) : void;
    setFilteringAvailable(value: string) : void;
    addCategory(value: any, taxonomyType: 'category' | 'status' | 'interface') : void;
    setModel(value: ModelDto) : void;
    setProfile(value: ProfileDto) : void;
    setGrounding(value: GroundingDto) : void;
    getServiceData() : ServiceDto;
  }

export class ServiceFactory implements IServiceFactory {
  
    private _id : string;
    private _name: string;
    private _version: string;
    private _description: string;
    private _filteringAvailable: string;
    private _categories : any[] = [];
    private _profile: ProfileDto;
    private _model : ModelDto;
    private _grounding : GroundingDto;
    
    constructor() {}

    setId(value) : void {
        this._id = value;
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

    setFilteringAvailable(value: string) : void {
        this._filteringAvailable = value;
    };

    addCategory(value: any, taxonomyType: 'category' | 'status' | 'interface'): void {
        const category = this.buildTaxonomy(value, taxonomyType);
        if (category) this._categories.push(category);
    }

    private buildTaxonomy(value: any, taxonomyType: 'category' | 'status' | 'interface'): any | undefined {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const taxonomy = this.compact({
                id: value.id,
                name: value.name,
                description: value.description,
                source: value.source
            });
            if (taxonomy.id && taxonomy.name && taxonomy.source) return taxonomy;
        }

        let code: string | undefined;
        let taxonomy: string;
        let categoryName: string;
        const rawCode = this.extractTaxonomyCode(value);
        if (!rawCode) return undefined;
        const key = rawCode.toUpperCase().replace(/-/g, '_');
        
        switch (taxonomyType) {
            case 'category':
                code = ServiceCategory[key];
                taxonomy = Taxonomy.SERVICE_CATEGORY;
                categoryName = "SWIM Service Category";
                break;
            case 'status':
                code = AvailabilityStatus[key];
                taxonomy = Taxonomy.AVAILABILITY_STATUS;
                categoryName = "Service Availability Status";
                break;
            case 'interface':
                code = InterfaceType[key];
                taxonomy = Taxonomy.INTERFACE_TYPE;
                categoryName = "Service Interface Type";
                break;
            default:
                return undefined;
        }

        if (!code) return undefined;

        return {
            id: `${taxonomy}#${code}`,
            name: this.formatTitle(code),
            description: categoryName,
            source: taxonomy
        };
    }

    setModel(value) : void {
        this._model = value;
    };

    setProfile(value) : void {
        this._profile = value;
    };

    setGrounding(value) : void {
        this._grounding = value;
    };

    private formatTitle(code: string): string {
        return code.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
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
    
    getServiceData() : ServiceDto {
        const service: any = {
            "id": this._id,
            "name": this._name,
            "version": this._version,
            "description": this._description
        };

        if (this._categories.length > 0) {
            service["category"] = this._categories;
        }
        if (this._filteringAvailable) {
            service["filtering-available"] = this._filteringAvailable;
        }

        const data: any = {
            "service": service
        };

        if(this._profile){
            data["profile"] = this._profile;
        }

        if(this._model){
            data["model"] = this._model;
        }

        if(this._grounding){
            data["grounding"] = this._grounding;
        }
      
        return data as ServiceDto; 
    };
}
