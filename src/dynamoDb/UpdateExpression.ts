import {
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap,
} from "aws-sdk/clients/dynamodb";

// http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html
export default class UpdateExpression {
  private setClause?: string;
  private removeClause?: string;
  private addClause?: string;
  private deleteClause?: string;

  readonly attributeNames: ExpressionAttributeNameMap;
  readonly attributeValues: ExpressionAttributeValueMap;

  constructor(
    attributeNames: ExpressionAttributeNameMap = {},
    attributeValues: ExpressionAttributeValueMap = {},
    setClause?: string,
    removeClause?: string,
    addClause?: string,
    deleteClause?: string
  ) {
    this.attributeNames = attributeNames;
    this.attributeValues = attributeValues;
    this.setClause = setClause;
    this.addClause = addClause;
    this.removeClause = removeClause;
    this.deleteClause = deleteClause;
  }

  get expression(): string {
    const clauses = Array<string>();
    if (this.setClause) {
      clauses.push(this.setClause);
    }
    if (this.removeClause) {
      clauses.push(this.removeClause);
    }
    if (this.addClause) {
      clauses.push(this.addClause);
    }
    if (this.deleteClause) {
      clauses.push(this.deleteClause);
    }
    return clauses.join(" ");
  }

  set(attribute: string, to: any): UpdateExpression {
    return this.copyAddingSetClause(
      `${this.addAttributeName(attribute)} = ${this.addAttributeValue(
        attribute,
        to
      )}`
    );
  }
  static set(attribute: string, to: any): UpdateExpression {
    return new UpdateExpression().set(attribute, to);
  }

  setIfNotExists(
    attribute: string,
    to: any,
    attributeToCheck?: string
  ): UpdateExpression {
    const placeholder = this.addAttributeName(attribute);
    let checkPlaceholder = placeholder;
    if (attributeToCheck) {
      checkPlaceholder = this.addAttributeName(attributeToCheck);
    }
    return this.copyAddingSetClause(
      `${placeholder} = if_not_exists(${checkPlaceholder}, ${this.addAttributeValue(
        attribute,
        to
      )})`
    );
  }
  static setIfNotExists(
    attribute: string,
    to: any,
    attributeToCheck?: string
  ): UpdateExpression {
    return new UpdateExpression().setIfNotExists(
      attribute,
      to,
      attributeToCheck
    );
  }

  increment(attribute: string, by: number): UpdateExpression {
    const placeholder = this.addAttributeName(attribute);
    return this.copyAddingSetClause(
      `${placeholder} = ${placeholder} + ${this.addAttributeValue(
        attribute,
        by
      )}`
    );
  }

  decrement(attribute: string, by: number): UpdateExpression {
    const placeholder = this.addAttributeName(attribute);
    return this.copyAddingSetClause(
      `${placeholder} = ${placeholder} - ${this.addAttributeValue(
        attribute,
        by
      )}`
    );
  }

  appendToList(listName: string, items: Array<any>): UpdateExpression {
    const placeholder = this.addAttributeName(listName);
    return this.copyAddingSetClause(
      `${placeholder} = list_append(${placeholder}, ${this.addAttributeValue(
        listName,
        items
      )})`
    );
  }

  appendToBeginingOfList(
    listName: string,
    items: Array<any>
  ): UpdateExpression {
    const placeholder = this.addAttributeName(listName);
    return this.copyAddingSetClause(
      `${placeholder} = list_append(${this.addAttributeValue(
        listName,
        items
      )}, ${placeholder})`
    );
  }

  addToSet(setName: string, items: Array<any>): UpdateExpression {
    return this.copyAddingAddClause(
      `${this.addAttributeName(setName)} ${this.addAttributeValue(
        setName,
        items
      )}`
    );
  }

  deleteFromSet(setName: string, items: Array<any>): UpdateExpression {
    return this.copyAddingDeleteClause(
      `${this.addAttributeName(setName)} ${this.addAttributeValue(
        setName,
        items
      )}`
    );
  }

  remove(attribute: string): UpdateExpression {
    return this.copyAddingRemoveClause(`${this.addAttributeName(attribute)}`);
  }

  removeFromList(listName: string, index: number): UpdateExpression {
    return this.copyAddingRemoveClause(
      `${this.addAttributeName(listName)}[${index}]`
    );
  }

  private addAttributeName(name: string): string {
    const key = `#${name}`;
    this.attributeNames[key] = name;
    return key;
  }

  private addAttributeValue(
    attributeName: string,
    value: any,
    id: number = 0
  ): string {
    const key = `:${attributeName}${id}`;
    if (this.attributeValues[key]) {
      return this.addAttributeValue(attributeName, value, id + 1);
    }
    this.attributeValues[key] = value;
    return key;
  }

  private copyAddingSetClause(clause: string) {
    return new UpdateExpression(
      this.attributeNames,
      this.attributeValues,
      this.buildClause("SET", clause, this.setClause),
      this.removeClause,
      this.addClause,
      this.deleteClause
    );
  }

  private copyAddingRemoveClause(clause: string) {
    return new UpdateExpression(
      this.attributeNames,
      this.attributeValues,
      this.setClause,
      this.buildClause("REMOVE", clause, this.removeClause),
      this.addClause,
      this.deleteClause
    );
  }

  private copyAddingAddClause(clause: string) {
    return new UpdateExpression(
      this.attributeNames,
      this.attributeValues,
      this.setClause,
      this.removeClause,
      this.buildClause("ADD", clause, this.addClause),
      this.deleteClause
    );
  }

  private copyAddingDeleteClause(clause: string) {
    return new UpdateExpression(
      this.attributeNames,
      this.attributeValues,
      this.setClause,
      this.removeClause,
      this.addClause,
      this.buildClause("DELETE", clause, this.deleteClause)
    );
  }

  private buildClause(type: string, newPart: string, existingPart?: string) {
    return existingPart ? `${existingPart}, ${newPart}` : `${type} ${newPart}`;
  }
}
