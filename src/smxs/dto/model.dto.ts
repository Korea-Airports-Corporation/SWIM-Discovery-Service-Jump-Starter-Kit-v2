import { DocumentDto, TaxonomyDto } from "./utility.dto";

export class ModelDto {
  "interface"?: {
    "name"?: string;
    "description"?: string;
    "category"?: TaxonomyDto;
    "operation"?: {
      "name": string;
      "description": string;
      "synchronicity"?: "synchronous" | "asynchronous";
      "precondition"?: string;
      "input"?: string;
      "output"?: string;
      "effect"?: string;
      "message-exchange-pattern"?: "in-out" | "out-in" | "in-only" | "out-only";
      "message"?: {
        "name": string;
        "description": string;
        "direction"?: "in" | "out";
        "header"?: {
          "name": string;
          "description": string;
          "permissible-value"?: string;
        }[];
        "payload"?: {
          "payload-type"?: "text" | "stream" | "map" | "object" | "byte";
          "name": string;
          "description": string;
        };
      }[];
    }[];
  };
  "data-specification"?: {
    "formal-language"?: string;
    "information-exchange-model"?: string;
    "source"?: DocumentDto;
  };
  "resource"?: {
    "id"?: string;
    "name"?: string;
    "description"?: string;
    "path"?: string;
    "method"?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "CONNECT" | "TRACE";
    "template"?: string;
    "parameter"?: {
      "name"?: string;
      "description"?: string;
      "parameter-type"?: "path" | "query" | "header";
      "permissible-value"?: string;
    }[];
  }[];
}
