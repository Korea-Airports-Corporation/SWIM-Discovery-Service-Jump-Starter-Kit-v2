import { PeerLinkDto } from "./utility.dto";

export class PeersDto {
  "service-id": string;
  "name": string;
  "version": string;
  "description": string;
  "links": PeerLinkDto[];
}
