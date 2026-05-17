import { PeersDto } from '../dto/peers.dto';

interface IPeersFactory {
    setServiceId(value: string) : void;
    setName(value: string) : void;
    setVersion(value: string) : void;
    setDescription(value: string) : void;
    setLinks(value: any[]) : void;
    getPeersData() : PeersDto;
  }

export class PeersFactory implements IPeersFactory {
    private _serviceId: string;
    private _name: string;
    private _version: string;
    private _description: string;
    private _links: any[];
  
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
    setLinks(value) : void {
        this._links = Array.isArray(value)
            ? value
                .filter(link => link && typeof link === 'object')
                .map(link => this.compact({
                    rel: link.rel,
                    title: link.title,
                    href: link.href
                }))
                .filter(link => this.hasContent(link))
            : [];
    };

    getPeersData() : any {

        const data = {
            "service-id": this._serviceId,
            "name": this._name,
            "version": this._version,
            "description": this._description,
            "links": this._links
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
