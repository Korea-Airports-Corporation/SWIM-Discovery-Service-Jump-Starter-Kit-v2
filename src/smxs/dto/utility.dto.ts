export class TaxonomyDto {
  "id": string;
  "name": string;
  "description"?: string;
  "source": string;
}

export class DocumentDto {
  "id"?: string;
  "title"?: string;
  "publisher"?: string;
  "date-issued"?: string;
  "version"?: string;
  "description"?: string;
  "location"?: string;
}

export class OrganizationDto {
  "id"?: string;
  "name"?: string;
  "description"?: string;
  "website"?: string;
  "point-of-contact"?: {
    "name": string;
    "function": string;
    "phone-number"?: string;
    "email": string;
  };
}

export class ServiceLinkDto {
  "rel": "service" | "describedby";
  "href": string;
  "title": string;
  "type": string;
  "language"?: string;
}

export class PeerLinkDto {
  "rel": "service";
  "title": string;
  "href": string;
}

export class CategoryLinkDto {
  "rel": "describedby" | "code";
  "href": string;
  "title": string;
  "type": "text/html";
  "language": "en";
}
