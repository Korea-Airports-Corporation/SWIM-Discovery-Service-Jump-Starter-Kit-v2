import { ProfileDto } from "./profile.dto";
import { ModelDto } from "./model.dto";
import { GroundingDto } from "./grounding.dto";
import { TaxonomyDto } from "./utility.dto";

export class ServiceDto {
  "service": {
    "id": string;
    "name": string;
    "description": string;
    "version": string;
    "category"?: TaxonomyDto[];
    "additional-information"?: string;
    "filtering-available"?: string;
    "source-of-information"?: string;
    "support-availability"?: string;
  };
  "profile": ProfileDto;
  "model": ModelDto;
  "grounding": GroundingDto;
}
