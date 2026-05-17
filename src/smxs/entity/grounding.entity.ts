import { GroundingDto } from "../dto/grounding.dto";

export class GroundingFactory {
    private _bindingName: string;
    private _bindingDescription: string;
    private _protocol: any;
    private _interface: string;
    private _endpointName: string;
    private _endpointDescription: string;
    private _networkAddress: string;

    setBindingInfo(name: string, description: string, protocol: any, interfaceName: string): void {
        this._bindingName = name;
        this._bindingDescription = description;
        this._protocol = protocol;
        this._interface = interfaceName;
    }

    setEndpointInfo(name: string, description: string, address: string): void {
        this._endpointName = name;
        this._endpointDescription = description;
        this._networkAddress = address;
    }

    getGroundingData(): GroundingDto {
        const data: any = {};

        // 1. Binding
        const binding: any = {};
        if (this._bindingName) binding.name = this._bindingName;
        if (this._interface) binding.interface = this._interface;
        if (this._bindingDescription) binding.description = this._bindingDescription;
        
        if (this._protocol) {
            const protocol: any = {
                id: this._protocol.id,
                title: this._protocol.title
            };
            if (this._protocol.publisher) protocol.publisher = this._protocol.publisher;
            if (this._protocol["date-issued"]) protocol["date-issued"] = this._protocol["date-issued"];
            if (this._protocol.version) protocol.version = this._protocol.version;
            if (this._protocol.description) protocol.description = this._protocol.description;
            if (this._protocol.location) protocol.location = this._protocol.location;
            binding.protocol = protocol;
        }

        if (Object.keys(binding).length > 0) {
            data["binding"] = binding;
        }

        // 2. Endpoint
        const endpoint: any = {};
        if (this._endpointName) endpoint.name = this._endpointName;
        if (this._endpointDescription) endpoint.description = this._endpointDescription;
        if (this._networkAddress) endpoint["network-address"] = this._networkAddress;

        if (Object.keys(endpoint).length > 0) {
            data["endpoint"] = endpoint;
        }

        return data;
    }
}
