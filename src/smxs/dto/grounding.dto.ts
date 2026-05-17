import { DocumentDto } from "./utility.dto";

export class GroundingDto {
  "binding": {
    "name": string;
    "description"?: string;
    "protocol": DocumentDto;
    "interface": string;
  };
  "endpoint": {
    "name"?: string;
    "description"?: string;
    "network-address"?: string;
  };
}
