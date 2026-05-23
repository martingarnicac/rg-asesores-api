import { Injectable, BadRequestException } from '@nestjs/common';

import { VariableDataType, VariableDataFormat } from '@/variables/entities';

const VALID_DATA_FORMATS: Record<VariableDataType, VariableDataFormat[]> = {
  [VariableDataType.TEXT]: [VariableDataFormat.TEXT, VariableDataFormat.EMAIL, VariableDataFormat.PHONE],
  [VariableDataType.BOOLEAN]: [VariableDataFormat.BOOLEAN],
  [VariableDataType.NUMBER]: [VariableDataFormat.NUMBER, VariableDataFormat.CURRENCY, VariableDataFormat.PERCENT],
  [VariableDataType.DATE]: [VariableDataFormat.DATE, VariableDataFormat.DATETIME],
  [VariableDataType.ENUM]: [VariableDataFormat.SELECT, VariableDataFormat.CHIPS],
};

const ARRAY_ALLOWED_TYPES = new Set<VariableDataType>([VariableDataType.NUMBER, VariableDataType.ENUM]);

@Injectable()
export class VariableTypeValidator {
  validateTypeAndFormat(dataType: VariableDataType, dataFormat: VariableDataFormat | null | undefined, isArray: boolean): void {
    // Validar is_array según tipo
    if (isArray && !ARRAY_ALLOWED_TYPES.has(dataType)) {
      throw new BadRequestException(`isArray=true no está permitido para dataType=${dataType}`);
    }

    // Validar data_format según tipo
    const allowedFormats = VALID_DATA_FORMATS[dataType];
    if (!dataFormat) {
      if (dataType === VariableDataType.TEXT || dataType === VariableDataType.BOOLEAN || dataType === VariableDataType.NUMBER || dataType === VariableDataType.DATE || dataType === VariableDataType.ENUM) {
        throw new BadRequestException(`dataFormat es requerido para dataType=${dataType}`);
      }
    } else if (!allowedFormats.includes(dataFormat)) {
      throw new BadRequestException(`dataFormat=${dataFormat} no es válido para dataType=${dataType}. Permitidos: ${allowedFormats.join(', ')}`);
    }
  }

  validateTypeOptions(dataType: VariableDataType, dataFormat: VariableDataFormat | null | undefined, isArray: boolean, typeOptions: Record<string, any>): void {
    if (!typeOptions || typeof typeOptions !== 'object') {
      throw new BadRequestException('typeOptions debe ser un objeto JSON válido');
    }

    switch (dataType) {
      case VariableDataType.TEXT:
        this.validateTextTypeOptions(typeOptions, dataFormat);
        break;
      case VariableDataType.BOOLEAN:
        this.validateBooleanTypeOptions(typeOptions);
        break;
      case VariableDataType.NUMBER:
        this.validateNumberTypeOptions(typeOptions, isArray);
        break;
      case VariableDataType.DATE:
        this.validateDateTypeOptions(typeOptions, dataFormat);
        break;
      case VariableDataType.ENUM:
        this.validateEnumTypeOptions(typeOptions, isArray);
        break;
    }
  }

  private validateTextTypeOptions(typeOptions: Record<string, any>, dataFormat: VariableDataFormat | null | undefined): void {
    if (typeOptions.string && typeof typeOptions.string !== 'object') {
      throw new BadRequestException('typeOptions.string debe ser un objeto');
    }
    if (typeOptions.messages && typeof typeOptions.messages !== 'object') {
      throw new BadRequestException('typeOptions.messages debe ser un objeto');
    }
  }

  private validateBooleanTypeOptions(typeOptions: Record<string, any>): void {
    if (typeOptions.boolean && typeof typeOptions.boolean !== 'object') {
      throw new BadRequestException('typeOptions.boolean debe ser un objeto');
    }
    if (typeOptions.boolean) {
      if (typeOptions.boolean.false_label && typeof typeOptions.boolean.false_label !== 'string') {
        throw new BadRequestException('typeOptions.boolean.false_label debe ser string');
      }
      if (typeOptions.boolean.true_label && typeof typeOptions.boolean.true_label !== 'string') {
        throw new BadRequestException('typeOptions.boolean.true_label debe ser string');
      }
    }
  }

  private validateNumberTypeOptions(typeOptions: Record<string, any>, isArray: boolean): void {
    if (isArray) {
      if (typeOptions.items && typeof typeOptions.items !== 'object') {
        throw new BadRequestException('typeOptions.items debe ser un objeto para NUMBER[]');
      }
      if (typeOptions.items?.number && typeof typeOptions.items.number !== 'object') {
        throw new BadRequestException('typeOptions.items.number debe ser un objeto');
      }
    } else {
      if (typeOptions.number && typeof typeOptions.number !== 'object') {
        throw new BadRequestException('typeOptions.number debe ser un objeto');
      }
      if (typeOptions.number?.currency_code && typeof typeOptions.number.currency_code !== 'string') {
        throw new BadRequestException('typeOptions.number.currency_code debe ser string');
      }
    }
    if (typeOptions.messages && typeof typeOptions.messages !== 'object') {
      throw new BadRequestException('typeOptions.messages debe ser un objeto');
    }
  }

  private validateDateTypeOptions(typeOptions: Record<string, any>, dataFormat: VariableDataFormat | null | undefined): void {
    if (!typeOptions.date || typeof typeOptions.date !== 'object') {
      throw new BadRequestException('typeOptions.date es requerido para DATE');
    }
    const { min, max, timezone } = typeOptions.date;
    if (min && typeof min !== 'object') {
      throw new BadRequestException('typeOptions.date.min debe ser un objeto');
    }
    if (max && typeof max !== 'object') {
      throw new BadRequestException('typeOptions.date.max debe ser un objeto');
    }
    if (timezone && typeof timezone !== 'string') {
      throw new BadRequestException('typeOptions.date.timezone debe ser string');
    }
    if (dataFormat === VariableDataFormat.DATETIME && !timezone) {
      // Podría ser opcional, según el schema. Lo dejamos como warning opcional.
    }
    if (typeOptions.messages && typeof typeOptions.messages !== 'object') {
      throw new BadRequestException('typeOptions.messages debe ser un objeto');
    }
  }

  private validateEnumTypeOptions(typeOptions: Record<string, any>, isArray: boolean): void {
    if (!typeOptions.items || typeof typeOptions.items !== 'object') {
      throw new BadRequestException('typeOptions.items es requerido para ENUM');
    }
    if (isArray) {
      if (typeOptions.items.min_count !== undefined && typeof typeOptions.items.min_count !== 'number') {
        throw new BadRequestException('typeOptions.items.min_count debe ser número');
      }
      if (typeOptions.items.max_count !== undefined && typeof typeOptions.items.max_count !== 'number') {
        throw new BadRequestException('typeOptions.items.max_count debe ser número');
      }
    }
    if (typeOptions.items.enum_values) {
      if (!Array.isArray(typeOptions.items.enum_values)) {
        throw new BadRequestException('typeOptions.items.enum_values debe ser un array');
      }
      for (const item of typeOptions.items.enum_values) {
        if (typeof item.value === 'undefined') {
          throw new BadRequestException('Cada enum_value debe tener un campo value');
        }
        if (typeof item.label !== 'string') {
          throw new BadRequestException('Cada enum_value debe tener un campo label string');
        }
        if (item.sort !== undefined && typeof item.sort !== 'number') {
          throw new BadRequestException('enum_value.sort debe ser número');
        }
      }
    }
    if (typeOptions.messages && typeof typeOptions.messages !== 'object') {
      throw new BadRequestException('typeOptions.messages debe ser un objeto');
    }
  }

  validateDefaultValue(dataType: VariableDataType, isArray: boolean, defaultValue: any, typeOptions?: Record<string, any>): void {
    if (defaultValue === null || defaultValue === undefined) return;

    switch (dataType) {
      case VariableDataType.TEXT:
        if (typeof defaultValue !== 'string') {
          throw new BadRequestException('defaultValue debe ser string para TEXT');
        }
        break;
      case VariableDataType.BOOLEAN:
        if (typeof defaultValue !== 'boolean') {
          throw new BadRequestException('defaultValue debe ser boolean para BOOLEAN');
        }
        break;
      case VariableDataType.NUMBER:
        if (isArray) {
          if (!Array.isArray(defaultValue)) {
            throw new BadRequestException('defaultValue debe ser array para NUMBER[]');
          }
          for (const v of defaultValue) {
            if (typeof v !== 'number') {
              throw new BadRequestException('defaultValue[] debe contener solo números');
            }
          }
        } else {
          if (typeof defaultValue !== 'number') {
            throw new BadRequestException('defaultValue debe ser number para NUMBER');
          }
        }
        break;
      case VariableDataType.DATE:
        if (typeof defaultValue === 'object' && defaultValue.kind) {
          if (!['today', 'now'].includes(defaultValue.kind)) {
            throw new BadRequestException('defaultValue.kind para DATE debe ser "today" o "now"');
          }
        } else if (typeof defaultValue !== 'string') {
          throw new BadRequestException('defaultValue para DATE debe ser string ISO o { kind: "today" | "now" }');
        }
        break;
      case VariableDataType.ENUM:
        if (isArray) {
          if (!Array.isArray(defaultValue)) {
            throw new BadRequestException('defaultValue debe ser array para ENUM[]');
          }
        } else {
          if (typeof defaultValue !== 'string') {
            throw new BadRequestException('defaultValue debe ser string para ENUM');
          }
        }
        // Validar contra enum_values si existen
        if (typeOptions?.items?.enum_values) {
          const validValues = typeOptions.items.enum_values.map((e: any) => e.value);
          const valuesToCheck = isArray ? defaultValue : [defaultValue];
          for (const v of valuesToCheck) {
            if (!validValues.includes(v)) {
              throw new BadRequestException(`defaultValue "${v}" no existe en enum_values`);
            }
          }
        }
        break;
    }
  }
}
