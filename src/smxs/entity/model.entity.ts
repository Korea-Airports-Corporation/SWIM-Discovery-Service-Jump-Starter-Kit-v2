import { ModelDto } from "../dto/model.dto";
import { InterfaceType } from "../enum/interface-type";
import { Taxonomy } from "../enum/taxonomy.enum";

export class ModelFactory {
    private _interfaceName: string;
    private _interfaceDescription: string;
    private _interfaceCategory: any;
    private _operations: any[] = [];
    private _dataSpecification: any;
    private _resources: any[] = [];

    setInterfaceName(value: string): void { this._interfaceName = value; }
    setInterfaceDescription(value: string): void { this._interfaceDescription = value; }
    setInterfaceCategory(value: any): void {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const taxonomy = this.compact({
                id: value.id,
                name: value.name,
                description: value.description,
                source: value.source
            });
            if (taxonomy.id && taxonomy.name && taxonomy.source) {
                this._interfaceCategory = taxonomy;
                return;
            }
        }

        const codeValue = this.extractTaxonomyCode(value);
        if (!codeValue) return;

        const key = codeValue.toUpperCase().replace(/-/g, '_');
        const code = InterfaceType[key] || codeValue;
        this._interfaceCategory = {
            id: `${Taxonomy.INTERFACE_TYPE}#${code}`,
            name: this.formatTitle(code),
            source: Taxonomy.INTERFACE_TYPE
        };
    }

    setDataSpecification(value: any): void {
        if (!value) return;
        this._dataSpecification = this.compact({
            "formal-language": value["formal-language"],
            "information-exchange-model": value["information-exchange-model"]
        });
        
        if (value.source) {
            this._dataSpecification.source = this.compact({
                id: value.source.id,
                title: value.source.title,
                publisher: value.source.publisher,
                "date-issued": value.source["date-issued"],
                version: value.source.version,
                description: value.source.description,
                location: value.source.location
            });
        }
    }

    setResources(values: any[]): void {
        if (!values || !Array.isArray(values)) return;
        this._resources = values.filter(res => res && typeof res === 'object').map(res => {
            const resource: any = this.compact({
                id: res.id,
                name: res.name,
                description: res.description,
                path: res.path,
                method: res.method,
                template: res.template
            });
            
            if (res.parameter && Array.isArray(res.parameter)) {
                resource.parameter = res.parameter
                    .filter(p => p && typeof p === 'object')
                    .map(p => this.compact({
                    name: p.name,
                    description: p.description,
                    "parameter-type": p["parameter-type"],
                    "permissible-value": this.normalizePermissibleValue(p["permissible-value"])
                }))
                    .filter(p => this.hasContent(p));
            }
            
            return resource;
        });
    }

    /**
     * Assemblies operations and their associated messages/headers.
     */
    setOperationsAndMessages(ops: any[], msgs: any[]): void {
        if (!Array.isArray(ops)) return;
        const messages = Array.isArray(msgs) ? msgs : [];

        for (const op of ops.filter(op => op && typeof op === 'object')) {
            // 1. Map messages and transform headers to match schema (name, description, permissible-value)
            const associatedMessages = messages.filter(m => m && typeof m === 'object' && m.operation === op.name).map(m => {
                const message: any = this.compact({
                    name: m.name,
                    description: m.description,
                    direction: m.direction
                });

                if (m.header && Array.isArray(m.header)) {
                    message.header = m.header.map(h => this.compact({
                        name: h.name,
                        description: h.description,
                        "permissible-value": this.normalizePermissibleValue(h["permissible-value"])
                    }));
                }

                if (m.payload) {
                    message.payload = this.compact({
                        "payload-type": m.payload["payload-type"],
                        name: m.payload.name,
                        description: m.payload.description
                    });
                }

                return message;
            });

            this._operations.push(this.compact({
                name: op.name,
                description: op.description,
                synchronicity: op.synchronicity,
                precondition: op.precondition,
                input: op.input,
                output: op.output,
                effect: op.effect,
                "message-exchange-pattern": this.mapMEP(op["message-exchange-pattern"] || op.messageExchangePattern),
                message: associatedMessages.length > 0 ? associatedMessages : undefined
            }));
        }
    }

    private mapMEP(value: string): any {
        if (typeof value !== 'string' || value.trim().length === 0) return undefined;
        const v = value.toLowerCase();
        if (v.includes("reply") || v.includes("in-out")) return "in-out";
        if (v.includes("subscribe") || v.includes("out-only")) return "out-only";
        return undefined;
    }

    getModelData(): ModelDto {
        const data: ModelDto = {};
        
        if (this._interfaceName) {
            const iface: any = {
                name: this._interfaceName
            };
            if (this._interfaceDescription) iface.description = this._interfaceDescription;
            if (this._interfaceCategory) iface.category = this._interfaceCategory;
            if (this._operations.length > 0) iface.operation = this._operations;
            data["interface"] = iface;
        }

        if (this._dataSpecification) {
            data["data-specification"] = this._dataSpecification;
        }

        if (this._resources.length > 0) {
            data["resource"] = this._resources;
        }

        return data;
    }

    private formatTitle(code: string): string {
        return code.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
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

    private normalizePermissibleValue(value: any): string | undefined {
        if (Array.isArray(value)) {
            const values = value
                .map(item => this.normalizePermissibleValue(item))
                .filter((item): item is string => typeof item === 'string' && item.length > 0);

            return values.length > 0 ? values.join(', ') : undefined;
        }

        if (typeof value === 'string') {
            const normalized = value.trim();
            return normalized.length > 0 ? normalized : undefined;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        return undefined;
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
}
