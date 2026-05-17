import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import * as draft4MetaSchema from 'ajv-draft-04/dist/refs/json-schema-draft-04.json';

@Injectable()
export class ValidationService {
  private ajv: Ajv;
  private readonly schemaDir = path.resolve(__dirname, '../../schema/sds/2.0.0');

  constructor() {
    this.ajv = new Ajv({ 
        allErrors: true, 
        strict: false, 
        validateSchema: false, // Required to avoid circular dependency when adding Draft 04 to Ajv 8
        loadSchema: this.loadSchema.bind(this)
    });
    
    // Add support for JSON Schema Draft 04
    this.ajv.addMetaSchema(draft4MetaSchema);
    
    addFormats(this.ajv);

    // Pre-load all SDS 2.0.0 schemas to resolve cross-references ($ref)
    this.loadAllSchemas();
  }

  private loadAllSchemas() {
    if (fs.existsSync(this.schemaDir)) {
      const files = fs.readdirSync(this.schemaDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.schemaDir, file);
            const schemaContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            // Use the filename as the schema key to support relative $ref (e.g., "utility.json")
            if (!this.ajv.getSchema(file)) {
              this.ajv.addSchema(schemaContent, file);
            }
          } catch (e) {
            console.error(`Failed to load schema ${file}:`, e.message);
          }
        }
      });
    } else {
      console.error(`SDS schema directory not found: ${this.schemaDir}`);
    }
  }

  private async loadSchema(uri: string) {
    return this.readSchema(uri);
  }

  private readSchema(uri: string): any {
    const uriWithoutFragment = uri.split('#')[0];
    const localFileName = uriWithoutFragment.startsWith('http://sdm-j-2.0.0/')
      ? path.basename(uriWithoutFragment)
      : uriWithoutFragment;
    const schemaPath = path.isAbsolute(localFileName)
      ? localFileName
      : path.resolve(this.schemaDir, localFileName);

    return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  }

  /**
   * Validates data against a JSON schema.
   * @param schemaPath Full path to the schema file.
   * @param data The data to validate.
   * @throws InternalServerErrorException if validation fails.
   */
  validate(schemaPath: string, data: any): boolean {
    try {
      const fileName = path.basename(schemaPath);
      let validate = this.ajv.getSchema(fileName);

      if (!validate) {
        // Fallback: load and compile manually if not pre-loaded
        const schema = this.readSchema(schemaPath);
        validate = this.ajv.compile(schema);
      }

      const valid = validate(data);

      if (!valid) {
        console.error('SDS Schema Validation Failed:', validate.errors);
        throw new InternalServerErrorException({
          message: 'Discovery Service data failed SDS 2.0.0 schema validation',
          schema: fileName,
          errors: validate.errors,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Error during schema validation:', error);
      throw new InternalServerErrorException('An error occurred during discovery service validation pipeline.');
    }
  }
}
