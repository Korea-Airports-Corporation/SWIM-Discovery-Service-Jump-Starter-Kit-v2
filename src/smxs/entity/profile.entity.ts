import { ProfileDto } from "../dto/profile.dto";
import { ServiceValidationType } from "../enum/service-validation-type";

export interface IProfileFactory {
    setProviderName(value: string) : void;
    setProviderDescription(value: string) : void;
    setProviderWebsite(value: string) : void;
    setProviderPointOfContactName(value: string) : void;
    setProviderPointOfContactFunction(value: string) : void;
    setProviderPointOfContactPhoneNumber(value: string) : void;
    setProviderPointOfContactEmail(value: string) : void;
    setQualityOfService(value: any) : void;
    setGeographicalExtent(value: any) : void;
    setEnvironmentalConstraint(value: any[]) : void;
    setServiceValidation(value: any) : void;
    setServiceLifecycleStatus(value: any, date?: string) : void;

    getProfileData() : ProfileDto;
}

export class ProfileFactory implements IProfileFactory {
    private _providerName: string;
    private _providerDescription: string;
    private _providerWebpage: string;
    private _providerPointOfContactName: string;
    private _providerPointOfContactFunction: string;
    private _providerPointOfContactPhoneNumber: string;
    private _providerPointOfContactEmail: string;
    
    private _qualityOfService: any[] = [];
    private _geographicalExtent: any;
    private _environmentalConstraint: any[] = [];
    private _serviceValidation: any;
    private _serviceLifecycleStatus: any;

    setProviderName(value: string): void { this._providerName = value; }
    setProviderDescription(value: string): void { this._providerDescription = value; }
    setProviderWebsite(value: string): void {
        const website = this.normalizeUri(value);
        if (website) this._providerWebpage = website;
    }
    setProviderPointOfContactName(value: string): void { this._providerPointOfContactName = value; }
    setProviderPointOfContactFunction(value: string): void { this._providerPointOfContactFunction = value; }
    setProviderPointOfContactPhoneNumber(value: string): void { this._providerPointOfContactPhoneNumber = value; }
    setProviderPointOfContactEmail(value: string): void { this._providerPointOfContactEmail = value; }

    setQualityOfService(value: any): void {
        if (!value) return;
        
        if (Array.isArray(value)) {
            this._qualityOfService = value
                .filter(item => item && typeof item === 'object')
                .map(item => this.compact({
                    name: item.name,
                    value: item.value,
                    description: item.description,
                    "calculation-method": item["calculation-method"],
                    "unit-of-measure": item["unit-of-measure"]
                }))
                .filter(item => this.hasContent(item));
        } else if (typeof value === 'string') {
            try {
                const jsonMatch = value.match(/\{.*\}/);
                if (jsonMatch) {
                    const qosObj = JSON.parse(jsonMatch[0]);
                    for (const [name, val] of Object.entries(qosObj)) {
                        if (val !== "NIL") {
                            this._qualityOfService.push({
                                name: name,
                                value: String(val),
                                description: `Quality of service parameter: ${name}`
                            });
                        }
                    }
                }
            } catch (e) {
                // Fallback minimal mapping
            }
        }
    }

    setGeographicalExtent(value: any): void {
        if (!value || value === "NIL") return;
        
        if (typeof value === 'object') {
            const geographicalExtent = this.compact({
                id: value.id,
                name: value.name,
                description: value.description,
                geometry: value.geometry,
                source: value.source
            });
            if (this.hasContent(geographicalExtent)) this._geographicalExtent = geographicalExtent;
        }
    }

    setEnvironmentalConstraint(value: any[]): void {
        if (!value || !Array.isArray(value)) return;
        this._environmentalConstraint = value
            .filter(item => item && typeof item === 'object')
            .map(item => this.compact({
                name: item.name,
                description: item.description
            }))
            .filter(item => this.hasContent(item));
    }

    setServiceValidation(value: any): void {
        if (!value) return;
        
        let type: string | undefined;
        let description: string | undefined;

        if (typeof value === 'string') {
            description = value;
            type = ServiceValidationType.SELF_VALIDATION;
        } else if (typeof value === 'object') {
            description = value.description;
            if (Object.values(ServiceValidationType).includes(value.type)) {
                type = value.type;
            }
        }

        const serviceValidation = this.compact({ type, description });
        if (this.hasContent(serviceValidation)) {
            this._serviceValidation = serviceValidation;
        }
    }

    setServiceLifecycleStatus(status: any, date?: string): void {
        const taxonomySource = "http://semantics.aero/availability-status";
        const taxonomy = this.buildTaxonomy(status, taxonomySource);
        if (!taxonomy) return;

        this._serviceLifecycleStatus = this.compact({
            status: taxonomy,
            date: date
        });
    }

    getProfileData(): ProfileDto {
        const data: ProfileDto = {};

        if (this._providerName) {
            const provider: any = { "name": this._providerName };
            if (this._providerDescription) provider.description = this._providerDescription;
            if (this._providerWebpage) provider["website"] = this._providerWebpage;
            
            if (this._providerPointOfContactName) {
                const poc: any = { "name": this._providerPointOfContactName };
                if (this._providerPointOfContactFunction) poc["function"] = this._providerPointOfContactFunction;
                if (this._providerPointOfContactEmail) poc["email"] = this._providerPointOfContactEmail;
                if (this._providerPointOfContactPhoneNumber) poc["phone-number"] = this._providerPointOfContactPhoneNumber;
                provider["point-of-contact"] = poc;
            }
            data["provider"] = provider;
        }

        if (this._qualityOfService && this._qualityOfService.length > 0) data["quality-of-service"] = this._qualityOfService;
        if (this._geographicalExtent) data["geographical-extent"] = this._geographicalExtent;
        if (this._environmentalConstraint && this._environmentalConstraint.length > 0) data["environmental-constraint"] = this._environmentalConstraint;
        if (this._serviceValidation) data["service-validation"] = this._serviceValidation;
        if (this._serviceLifecycleStatus) data["service-lifecycle-status"] = this._serviceLifecycleStatus;

        return data; 
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

    private normalizeUri(value: any): string | undefined {
        if (typeof value !== 'string') return undefined;

        const uri = value.trim();
        if (uri.length === 0) return undefined;

        if (/^[a-z][a-z0-9+.-]*:/i.test(uri)) {
            return uri;
        }

        return `https://${uri}`;
    }

    private buildTaxonomy(value: any, taxonomySource: string): any | undefined {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const taxonomy = this.compact({
                id: value.id,
                name: value.name,
                description: value.description,
                source: value.source
            });
            if (taxonomy.id && taxonomy.name && taxonomy.source) return taxonomy;
        }

        const code = this.extractTaxonomyCode(value);
        if (!code) return undefined;

        return {
            id: `${taxonomySource}#${code}`,
            name: this.formatTitle(code),
            source: taxonomySource
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

    private formatTitle(code: string): string {
        return code.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
    }
}
