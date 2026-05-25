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

/* ── Estructuras esqueleto (todos los valores se sobreescriben con el input o quedan en null) ── */

function buildTextSkeleton() {
  return {
    string: {
      min_length: null,
      max_length: null,
      pattern: null,
    },
    messages: {
      'string.min_length': null,
      'string.max_length': null,
      'string.pattern': null,
    },
  };
}

function buildBooleanSkeleton() {
  return {
    boolean: {
      false_label: null,
      true_label: null,
    },
  };
}

function buildNumberSkeleton(isArray: boolean) {
  if (isArray) {
    return {
      items: {
        min_count: null,
        max_count: null,
        number: {
          min: null,
          max: null,
          decimal_places: null,
          allow_negative: null,
          currency_code: null,
        },
      },
      messages: {
        'items.min_count': null,
        'items.max_count': null,
        'number.min': null,
        'number.max': null,
        'number.decimal_places': null,
        'number.allow_negative': null,
        'number.currency_code': null,
      },
    };
  }
  return {
    number: {
      min: null,
      max: null,
      decimal_places: null,
      allow_negative: null,
      currency_code: null,
    },
    messages: {
      'number.min': null,
      'number.max': null,
      'number.decimal_places': null,
      'number.allow_negative': null,
      'number.currency_code': null,
    },
  };
}

function buildDateSkeleton() {
  return {
    date: {
      min: null,
      max: null,
      timezone: null,
    },
    messages: {
      'date.min': null,
      'date.max': null,
      'date.timezone': null,
    },
  };
}

function buildEnumSkeleton(isArray: boolean) {
  if (isArray) {
    return {
      items: {
        min_count: null,
        max_count: null,
        enum_values: [],
      },
      messages: {
        'items.min_count': null,
        'items.max_count': null,
      },
    };
  }
  return {
    items: {
      enum_values: [],
    },
  };
}

/* ── helpers ── */

function deepSetValue(target: any, path: string[], value: any): void {
  const [head, ...tail] = path;
  if (!head) return;
  if (tail.length === 0) {
    target[head] = value;
    return;
  }
  if (target[head] === undefined || target[head] === null) {
    target[head] = {};
  }
  deepSetValue(target[head], tail, value);
}

function getValueAtPath(obj: any, path: string[]): any | undefined {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

function isPlainObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/* ── extractor: extrae los valores que SÍ envió el cliente respetando la estructura permitida ── */

interface FlatRule {
  path: string[];
  type: 'null' | 'boolean' | 'number' | 'string' | 'object' | 'array' | 'any';
  required?: boolean;
}

function getRulesForType(dataType: VariableDataType, isArray: boolean): FlatRule[] {
  const rules: FlatRule[] = [];

  switch (dataType) {
    case VariableDataType.TEXT:
      rules.push(
        { path: ['string', 'min_length'], type: 'number' },
        { path: ['string', 'max_length'], type: 'number' },
        { path: ['string', 'pattern'], type: 'string' },
        { path: ['messages', 'string.min_length'], type: 'string' },
        { path: ['messages', 'string.max_length'], type: 'string' },
        { path: ['messages', 'string.pattern'], type: 'string' },
      );
      break;

    case VariableDataType.BOOLEAN:
      rules.push(
        { path: ['boolean', 'false_label'], type: 'string' },
        { path: ['boolean', 'true_label'], type: 'string' },
      );
      break;

    case VariableDataType.NUMBER:
      if (isArray) {
        rules.push(
          { path: ['items', 'min_count'], type: 'number' },
          { path: ['items', 'max_count'], type: 'number' },
          { path: ['items', 'number', 'min'], type: 'number' },
          { path: ['items', 'number', 'max'], type: 'number' },
          { path: ['items', 'number', 'decimal_places'], type: 'number' },
          { path: ['items', 'number', 'allow_negative'], type: 'boolean' },
          { path: ['items', 'number', 'currency_code'], type: 'string' },
          { path: ['messages', 'items.min_count'], type: 'string' },
          { path: ['messages', 'items.max_count'], type: 'string' },
          { path: ['messages', 'number.min'], type: 'string' },
          { path: ['messages', 'number.max'], type: 'string' },
          { path: ['messages', 'number.decimal_places'], type: 'string' },
          { path: ['messages', 'number.allow_negative'], type: 'string' },
          { path: ['messages', 'number.currency_code'], type: 'string' },
        );
      } else {
        rules.push(
          { path: ['number', 'min'], type: 'number' },
          { path: ['number', 'max'], type: 'number' },
          { path: ['number', 'decimal_places'], type: 'number' },
          { path: ['number', 'allow_negative'], type: 'boolean' },
          { path: ['number', 'currency_code'], type: 'string' },
          { path: ['messages', 'number.min'], type: 'string' },
          { path: ['messages', 'number.max'], type: 'string' },
          { path: ['messages', 'number.decimal_places'], type: 'string' },
          { path: ['messages', 'number.allow_negative'], type: 'string' },
          { path: ['messages', 'number.currency_code'], type: 'string' },
        );
      }
      break;

    case VariableDataType.DATE:
      rules.push(
        { path: ['date', 'min'], type: 'object' },
        { path: ['date', 'max'], type: 'object' },
        { path: ['date', 'timezone'], type: 'string' },
        { path: ['messages', 'date.min'], type: 'string' },
        { path: ['messages', 'date.max'], type: 'string' },
        { path: ['messages', 'date.timezone'], type: 'string' },
      );
      break;

    case VariableDataType.ENUM:
      if (isArray) {
        rules.push(
          { path: ['items', 'min_count'], type: 'number' },
          { path: ['items', 'max_count'], type: 'number' },
          { path: ['items', 'enum_values'], type: 'array', required: true },
          { path: ['messages', 'items.min_count'], type: 'string' },
          { path: ['messages', 'items.max_count'], type: 'string' },
        );
      } else {
        rules.push(
          { path: ['items', 'enum_values'], type: 'array', required: true },
        );
      }
      break;
  }

  return rules;
}

function validateTypeAgainstRule(value: any, rule: FlatRule): string | null {
  if (value === null || value === undefined) return null;

  switch (rule.type) {
    case 'boolean':
      return typeof value === 'boolean' ? null : `${rule.path.join('.')} debe ser boolean o null`;
    case 'number':
      return typeof value === 'number' ? null : `${rule.path.join('.')} debe ser number o null`;
    case 'string':
      return typeof value === 'string' ? null : `${rule.path.join('.')} debe ser string o null`;
    case 'array':
      return Array.isArray(value) ? null : `${rule.path.join('.')} debe ser array o null`;
    case 'object':
      return isPlainObject(value) ? null : `${rule.path.join('.')} debe ser objeto o null`;
    case 'any':
    default:
      return null;
  }
}

@Injectable()
export class VariableTypeValidator {
  validateTypeAndFormat(dataType: VariableDataType, dataFormat: VariableDataFormat | null | undefined, isArray: boolean): void {
    if (isArray && !ARRAY_ALLOWED_TYPES.has(dataType)) {
      throw new BadRequestException(`isArray=true no está permitido para dataType=${dataType}`);
    }

    const allowedFormats = VALID_DATA_FORMATS[dataType];
    if (!dataFormat) {
      throw new BadRequestException(`dataFormat es requerido para dataType=${dataType}`);
    }
    if (!allowedFormats.includes(dataFormat)) {
      throw new BadRequestException(
        `dataFormat=${dataFormat} no es válido para dataType=${dataType}. Permitidos: ${allowedFormats.join(', ')}`,
      );
    }
  }

  /**
   * Valida que el cliente solo envíe propiedades permitidas, comprueba tipos,
   * verifica requisitos obligatorios y devuelve el objeto estructurado con
   * nulls en las propiedades faltantes.
   */
  normalizeAndValidateTypeOptions(
    dataType: VariableDataType,
    dataFormat: VariableDataFormat | null | undefined,
    isArray: boolean,
    typeOptions: Record<string, any> | null | undefined,
  ): Record<string, any> {
    // Si el cliente no envió nada, armamos el objeto completo con todos los valores en null
    if (!typeOptions || !isPlainObject(typeOptions) || Object.keys(typeOptions).length === 0) {
      return this.buildSkeleton(dataType, isArray);
    }

    // Validar que solo envíe claves permitidas en la raíz
    const allowedRootKeys = this.getAllowedRootKeys(dataType, isArray);
    const rootKeys = Object.keys(typeOptions);
    for (const key of rootKeys) {
      if (!allowedRootKeys.includes(key)) {
        throw new BadRequestException(
          `La propiedad "${key}" no está permitida en typeOptions para dataType=${dataType} e isArray=${isArray}`,
        );
      }
    }

    // Reglas planas
    const rules = getRulesForType(dataType, isArray);
    const errors: string[] = [];

    for (const rule of rules) {
      const rawValue = getValueAtPath(typeOptions, rule.path);

      if (rawValue === undefined) {
        // no envió esta prop → se deja como null más adelante
        continue;
      }

      const typeError = validateTypeAgainstRule(rawValue, rule);
      if (typeError) {
        errors.push(typeError);
      }
    }

    // Validar requisitos obligatorios
    for (const rule of rules) {
      if (rule.required) {
        const rawValue = getValueAtPath(typeOptions, rule.path);
        if (rawValue === undefined || rawValue === null) {
          errors.push(`${rule.path.join('.')} es obligatorio para dataType=${dataType}`);
        }
      }
    }

    // Validar contenido de enum_values cuando se envía
    const enumValuesRule = rules.find((r) => r.path.join('.') === 'items.enum_values');
    if (enumValuesRule) {
      const enumValues = getValueAtPath(typeOptions, ['items', 'enum_values']);
      if (enumValues !== undefined && enumValues !== null) {
        if (!Array.isArray(enumValues)) {
          errors.push('items.enum_values debe ser un array');
        } else if (enumValues.length === 0) {
          errors.push('items.enum_values debe contener al menos un elemento');
        } else {
          for (let i = 0; i < enumValues.length; i++) {
            const item = enumValues[i];
            if (!isPlainObject(item)) {
              errors.push(`items.enum_values[${i}] debe ser un objeto`);
              continue;
            }
            if (item.value === undefined) {
              errors.push(`items.enum_values[${i}].value es requerido`);
            }
            if (typeof item.label !== 'string') {
              errors.push(`items.enum_values[${i}].label debe ser string`);
            }
            if (item.sort !== undefined && typeof item.sort !== 'number') {
              errors.push(`items.enum_values[${i}].sort debe ser number`);
            }
          }
        }
      }
    }

    // Validar estructura de date.min y date.max cuando se envían
    if (dataType === VariableDataType.DATE) {
      for (const prop of ['min', 'max'] as const) {
        const val = typeOptions.date?.[prop];
        if (val !== undefined && val !== null) {
          if (!isPlainObject(val)) {
            errors.push(`date.${prop} debe ser un objeto o null`);
          } else {
            if (val.kind !== undefined && val.kind !== null && typeof val.kind !== 'string') {
              errors.push(`date.${prop}.kind debe ser string o null`);
            }
            if (val.offset_days !== undefined && val.offset_days !== null && typeof val.offset_days !== 'number') {
              errors.push(`date.${prop}.offset_days debe ser number o null`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }

    // Construir el esqueleto y sobrescribir con los valores que SÍ envió el cliente
    const skeleton = this.buildSkeleton(dataType, isArray);
    for (const rule of rules) {
      const clientValue = getValueAtPath(typeOptions, rule.path);
      if (clientValue !== undefined) {
        deepSetValue(skeleton, rule.path, clientValue);
      }
    }

    // Si es ENUM y envió enum_values, copiarlos explícitamente (deepSetValue con arrays)
    if (dataType === VariableDataType.ENUM) {
      const enumValues = getValueAtPath(typeOptions, ['items', 'enum_values']);
      if (enumValues !== undefined) {
        skeleton.items.enum_values = enumValues;
      }
    }

    return skeleton;
  }

  private getAllowedRootKeys(dataType: VariableDataType, isArray: boolean): string[] {
    switch (dataType) {
      case VariableDataType.TEXT:
        return ['string', 'messages'];
      case VariableDataType.BOOLEAN:
        return ['boolean'];
      case VariableDataType.NUMBER:
        return isArray ? ['items', 'messages'] : ['number', 'messages'];
      case VariableDataType.DATE:
        return ['date', 'messages'];
      case VariableDataType.ENUM:
        return isArray ? ['items', 'messages'] : ['items'];
      default:
        return [];
    }
  }

  private buildSkeleton(dataType: VariableDataType, isArray: boolean): Record<string, any> {
    switch (dataType) {
      case VariableDataType.TEXT:
        return buildTextSkeleton();
      case VariableDataType.BOOLEAN:
        return buildBooleanSkeleton();
      case VariableDataType.NUMBER:
        return buildNumberSkeleton(isArray);
      case VariableDataType.DATE:
        return buildDateSkeleton();
      case VariableDataType.ENUM:
        return buildEnumSkeleton(isArray);
      default:
        return {};
    }
  }

  validateDefaultValue(
    dataType: VariableDataType,
    isArray: boolean,
    defaultValue: any,
    typeOptions?: Record<string, any>,
  ): void {
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
