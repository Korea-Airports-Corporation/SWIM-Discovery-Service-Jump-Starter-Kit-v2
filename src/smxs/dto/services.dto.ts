import { CategoryLinkDto } from "./utility.dto";

export class ServicesDto {
  "service-id" : string;
  "name": string;
  "version": string;
  "description" : string;
  "categories" : {
    "category": string;
    "links": CategoryLinkDto[];
  }[];
}
