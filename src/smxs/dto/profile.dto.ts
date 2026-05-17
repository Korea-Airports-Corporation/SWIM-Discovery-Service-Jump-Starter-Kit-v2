import { DocumentDto, OrganizationDto, TaxonomyDto } from "./utility.dto";

export class ProfileDto {
  "provider"?: OrganizationDto;
  "consumer"?: OrganizationDto;
  "function"?: {
    "name"?: string;
    "description"?: string;
    "real-world-effect"?: string;
  }[];
  "security-mechanism"?: {
    "name"?: string;
    "description"?: string;
    "category"?: TaxonomyDto;
    "protocol"?: DocumentDto;
    "access-restrictions"?: string;
    "information-security-category"?: string;
  }[];
  "policy"?: {
    "name"?: string;
    "description"?: string;
    "source"?: DocumentDto;
  }[];
  "quality-of-service"?: {
    "name"?: string;
    "value"?: string;
    "description"?: string;
    "calculation-method"?: string;
    "unit-of-measure"?: string;
  }[];
  "geographical-extent"?: {
    "id"?: string;
    "name"?: string;
    "description"?: string;
    "source"?: DocumentDto;
    "geometry"?: string;
  };
  "environmental-constraint"?: {
    "name"?: string;
    "description"?: string;
  }[];
  "service-validation"?: {
    "type"?: "independent-validation" | "collaborative-validation" | "user-validation" | "self-validation";
    "description"?: string;
  };
  "service-lifecycle-status"?: {
    "status": TaxonomyDto;
    "date"?: string;
  };
}
