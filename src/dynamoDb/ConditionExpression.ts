import { validateConditionExpression } from "./conditionExpressionValidation";
import {
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap,
} from "aws-sdk/clients/dynamodb";

enum ConditionExpressionType {
  FILTER = "FILTER",
  KEY = "KEY",
}

export type AttributeValue = any;
export type Comparator = "=" | "<>" | "<" | "<=" | ">" | ">=";
export type ExpressionAttributeType = "name" | "value";
export type ConjunctionOperator = "AND" | "OR";
export type NotOperator = "NOT";
export type ParensOperator = "(" | ")";
export type ClauseOperator = ConjunctionOperator | NotOperator | ParensOperator;

// http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html
export default class ConditionExpression {
  type: ConditionExpressionType;
  private _expression: string;
  private attributes: ExpressionAttributeHelper;
  private leftArgumentName: string;

  get expression(): string {
    return this._expression;
  }
  get attributeNames(): ExpressionAttributeNameMap | undefined {
    if (Object.keys(this.attributes.attributeNames).length) {
      return this.attributes.attributeNames;
    }
    return undefined;
  }
  get attributeValues(): ExpressionAttributeValueMap | undefined {
    if (Object.keys(this.attributes.attributeValues).length) {
      return this.attributes.attributeValues;
    }
    return undefined;
  }

  constructor(
    type: ConditionExpressionType,
    expression = "",
    attributes = new ExpressionAttributeHelper(),
    leftArgumentName = ""
  ) {
    this.type = type;
    this._expression = expression;
    this.attributes = attributes;
    this.leftArgumentName = leftArgumentName;
  }

  validate() {
    if (!this._expression) {
      return;
    }
    try {
      validateConditionExpression(this._expression);
    } catch (error) {
      throw new Error(
        `Invalid expression: "${this._expression}" at "${error.message}"`
      );
    }
  }

  static get not(): ConditionExpression {
    return new ConditionExpression(ConditionExpressionType.KEY).not;
  }
  static get openParens(): ConditionExpression {
    return new ConditionExpression(ConditionExpressionType.KEY).openParens;
  }
  static whereKey(key: string): ConditionExpression {
    return new ConditionExpression(ConditionExpressionType.KEY).key(key);
  }
  static filterWhere(attribute: string): ConditionExpression {
    return new ConditionExpression(ConditionExpressionType.FILTER).attribute(
      attribute
    );
  }

  key(key: string): ConditionExpression {
    this.assertNoStringOperand("key");
    return new ConditionExpression(
      this.type,
      this._expression,
      this.attributes.copy(),
      key
    );
  }
  attribute(attribute: string): ConditionExpression {
    this.assertNoStringOperand("attribute");
    return new ConditionExpression(
      this.type,
      this._expression,
      this.attributes.copy(),
      attribute
    );
  }
  equals(value: AttributeValue): ConditionExpression {
    return this.copyAddingComparison("=", value);
  }
  equalsAttribute(attribute: string): ConditionExpression {
    return this.copyAddingComparison("=", attribute);
  }
  notEquals(value: AttributeValue): ConditionExpression {
    return this.copyAddingComparison("<>", value);
  }
  notEqualsAttribute(attribute: string): ConditionExpression {
    return this.copyAddingComparison("<>", attribute);
  }
  isGreaterThan(value: AttributeValue): ConditionExpression {
    return this.copyAddingComparison(">", value);
  }
  isGreaterThanAttribute(attribute: string): ConditionExpression {
    return this.copyAddingComparison(">", attribute);
  }
  isGreaterOrEqualTo(value: AttributeValue): ConditionExpression {
    return this.copyAddingComparison(">=", value);
  }
  isGreaterOrEqualToAttribute(attribute: string): ConditionExpression {
    return this.copyAddingComparison(">=", attribute);
  }
  isLessThan(value: AttributeValue): ConditionExpression {
    return this.copyAddingComparison("<", value);
  }
  isLessThanAttribute(attribute: string): ConditionExpression {
    return this.copyAddingComparison("<", attribute);
  }
  isLessOrEqualTo(value: AttributeValue): ConditionExpression {
    return this.copyAddingComparison("<=", value);
  }
  isLessOrEqualToAttribute(attribute: string): ConditionExpression {
    return this.copyAddingComparison("<=", attribute);
  }
  isBetween(a: AttributeValue, b: AttributeValue): ConditionExpression {
    this.assertStringOperand("BETWEEN");
    const attributes = this.attributes.copy();
    const left = attributes.addAttributeName(this.leftArgumentName);
    const aPlaceholder = attributes.addAttributeValue(this.leftArgumentName, a);
    const bPlaceholder = attributes.addAttributeValue(this.leftArgumentName, b);
    const expression = `${left} BETWEEN ${aPlaceholder} AND ${bPlaceholder}`;
    return this.copyAddingExpression(expression, attributes);
  }
  isIn(list: AttributeValue[]): ConditionExpression {
    this.assertStringOperand("IN");
    const attributes = this.attributes.copy();
    const left = attributes.addAttributeName(this.leftArgumentName);
    const listPlaceholders = list.map((value) =>
      attributes.addAttributeValue(this.leftArgumentName, value)
    );
    const expression = `${left} IN (${listPlaceholders.join(", ")})`;
    return this.copyAddingExpression(expression, attributes);
  }
  // expression functions
  beginsWith(substring: string): ConditionExpression {
    return this.copyAddingFunction("begins_with", substring);
  }
  contains(substring: string): ConditionExpression {
    return this.copyAddingFunction("contains", substring);
  }
  get exists(): ConditionExpression {
    return this.copyAddingFunction("attribute_exists");
  }
  get notExists(): ConditionExpression {
    return this.copyAddingFunction("attribute_not_exists");
  }
  isType(type: any): ConditionExpression {
    return this.copyAddingFunction("attribute_type", type);
  }
  get size(): ConditionExpression {
    return this.copyAddingFunction("size");
  }
  // condition clause operators
  get and(): ConditionExpression {
    this.assertNoStringOperand("and");
    this.assertExpression("and");
    return this.copyAddingExpression(" AND ", this.attributes.copy());
  }
  get or(): ConditionExpression {
    this.assertNoStringOperand("or");
    this.assertExpression("or");
    return this.copyAddingExpression(" OR ", this.attributes.copy());
  }
  get not(): ConditionExpression {
    this.assertNoStringOperand("not");
    return this.copyAddingExpression("NOT ", this.attributes.copy());
  }
  get openParens(): ConditionExpression {
    this.assertNoStringOperand("openParens");
    return this.copyAddingExpression("( ", this.attributes.copy());
  }

  get closeParens(): ConditionExpression {
    this.assertNoStringOperand("closeParens");
    return this.copyAddingExpression(" )", this.attributes.copy());
  }

  toString(): string {
    return this.expression;
  }

  private copyAddingComparison(
    comparator: Comparator,
    right: AttributeValue
  ): ConditionExpression {
    this.assertStringOperand(comparator);
    const attributes = this.attributes.copy();
    const leftPlaceholder = attributes.addAttributeName(this.leftArgumentName);
    const rightPlaceholder = attributes.addAttributeValue(
      this.leftArgumentName,
      right
    );
    const expression = `${leftPlaceholder} ${comparator} ${rightPlaceholder}`;
    return this.copyAddingExpression(expression, attributes);
  }

  private copyAddingFunction(
    functionName: string,
    arg?: any
  ): ConditionExpression {
    this.assertStringOperand(functionName);
    const attributes = this.attributes.copy();
    const name = attributes.addAttributeName(this.leftArgumentName);
    let argPlaceholder;
    if (arg !== undefined) {
      argPlaceholder = attributes.addAttributeValue(this.leftArgumentName, arg);
    }
    const expression = `${functionName} (${name}${
      argPlaceholder ? `, ${argPlaceholder}` : ""
    })`;
    return this.copyAddingExpression(expression, attributes);
  }

  private copyAddingExpression(
    expression: string,
    attributes: ExpressionAttributeHelper
  ): ConditionExpression {
    let newExpression = this._expression;
    if (newExpression.length > 0) {
      if (!newExpression.endsWith(" ") && !expression.startsWith(" ")) {
        throw new Error(`Invalid expression "${newExpression}${expression}"`);
      }
      newExpression = newExpression + expression;
    } else {
      newExpression = expression;
    }
    return new ConditionExpression(this.type, newExpression, attributes.copy());
  }

  private assertStringOperand(context: string) {
    if (!this.leftArgumentName) {
      throw new Error(`Attribute name required before "${context}"`);
    }
  }

  private assertNoStringOperand(context: string) {
    if (this.leftArgumentName) {
      throw new Error(
        `"${context}" cannot come right after argument "${this.leftArgumentName}"`
      );
    }
  }

  private assertExpression(context: string) {
    if (this._expression.length === 0) {
      throw new Error(`Expression clause required before "${context}"`);
    }
  }
}

class ExpressionAttributeHelper {
  attributeNames: ExpressionAttributeNameMap = {};
  attributeValues: ExpressionAttributeValueMap = {};

  constructor(attributeNames = {}, attributeValues = {}) {
    Object.keys(attributeNames).forEach(
      (key) => (this.attributeNames[key] = attributeNames[key])
    );
    Object.keys(attributeValues).forEach(
      (key) => (this.attributeValues[key] = attributeValues[key])
    );
  }

  addAttributeName(name: string): String {
    const keys = name.split(".").map((item) => `#${item}`);
    const names = name.split(".");
    for (const i in keys) {
      this.attributeNames[keys[i]] = names[i];
    }
    return keys.join(".");
  }

  addAttributeValue(
    attributeName: string,
    value: AttributeValue,
    id: number = 0
  ): string {
    const key = `:${attributeName.replace(/\./g, "_")}${id}`;
    if (this.attributeValues[key]) {
      return this.addAttributeValue(attributeName, value, id + 1);
    }
    this.attributeValues[key] = value;
    return key;
  }

  copy(): ExpressionAttributeHelper {
    return new ExpressionAttributeHelper(
      this.attributeNames,
      this.attributeValues
    );
  }
}
