import ConditionExpression from "./../ConditionExpression";

describe("Dynamo ConditionExpression", () => {
  it("should create equality expression", () => {
    const expression = ConditionExpression.whereKey("name").equals("1234");
    expect(expression.toString()).toEqual("#name = :name0");
  });

  it("should create equality expression between two attributes", () => {
    const expression = ConditionExpression.whereKey("name").equalsAttribute(
      "grandpa"
    );
    expect(expression.toString()).toEqual("#name = :name0");
  });

  it("should create inequality expressions", () => {
    let expression = ConditionExpression.whereKey("name").notEquals("1234");
    expect(expression.toString()).toEqual("#name <> :name0");

    expression = ConditionExpression.whereKey("name").isGreaterThan("1234");
    expect(expression.toString()).toEqual("#name > :name0");

    expression = ConditionExpression.whereKey("name").isGreaterOrEqualTo(
      "1234"
    );
    expect(expression.toString()).toEqual("#name >= :name0");

    expression = ConditionExpression.whereKey("name").isLessThan("1234");
    expect(expression.toString()).toEqual("#name < :name0");

    expression = ConditionExpression.whereKey("name").isLessOrEqualTo("1234");
    expect(expression.toString()).toEqual("#name <= :name0");
  });

  it("should create inequality expressions between two attributes", () => {
    let expression = ConditionExpression.whereKey("name").notEqualsAttribute(
      "baby"
    );
    expect(expression.toString()).toEqual("#name <> :name0");

    expression = ConditionExpression.whereKey("name").isGreaterThanAttribute(
      "brother"
    );
    expect(expression.toString()).toEqual("#name > :name0");

    expression = ConditionExpression.whereKey(
      "name"
    ).isGreaterOrEqualToAttribute("brother");
    expect(expression.toString()).toEqual("#name >= :name0");

    expression = ConditionExpression.whereKey("name").isLessThanAttribute(
      "mom"
    );
    expect(expression.toString()).toEqual("#name < :name0");

    expression = ConditionExpression.whereKey("name").isLessOrEqualToAttribute(
      "dad"
    );
    expect(expression.toString()).toEqual("#name <= :name0");
  });

  it('should create "between" expression', () => {
    const expression = ConditionExpression.whereKey("number").isBetween(1, 100);
    expect(expression.toString()).toEqual(
      "#number BETWEEN :number0 AND :number1"
    );
    expect(expression.attributeNames).toHaveProperty("#number", "number");
  });

  it('should create "IN" expression', () => {
    const expression = ConditionExpression.whereKey("number").isIn([1, 2, 3]);
    expect(expression.toString()).toEqual(
      "#number IN (:number0, :number1, :number2)"
    );
    expect(expression.attributeNames).toHaveProperty("#number", "number");
  });

  it('should create "begins_with" expression', () => {
    const expression = ConditionExpression.whereKey("name").beginsWith(
      "employee"
    );
    expect(expression.toString()).toEqual("begins_with (#name, :name0)");
  });

  it('should create "contains" expression', () => {
    const expression = ConditionExpression.whereKey("name").contains(
      "employee"
    );
    expect(expression.toString()).toEqual("contains (#name, :name0)");
  });

  it('should create "attribute_exists" expression', () => {
    const expression = ConditionExpression.whereKey("name").exists;
    expect(expression.toString()).toEqual("attribute_exists (#name)");
  });

  it('should create "attribute_not_exists" expression', () => {
    const expression = ConditionExpression.whereKey("name").notExists;
    expect(expression.toString()).toEqual("attribute_not_exists (#name)");
  });

  it('should create "attribute_type" expression', () => {
    const expression = ConditionExpression.whereKey("name").isType("S");
    expect(expression.toString()).toEqual("attribute_type (#name, :name0)");
  });

  it('should create "size" expression', () => {
    const expression = ConditionExpression.whereKey("name").size;
    expect(expression.toString()).toEqual("size (#name)");
  });

  it('should create "and" expression', () => {
    const expression = ConditionExpression.whereKey("number")
      .exists.and.key("number")
      .isBetween(1, 100)
      .and.key("number")
      .isType("N");
    expect(expression.toString()).toEqual(
      "attribute_exists (#number) AND #number BETWEEN :number0 AND :number1 AND attribute_type (#number, :number2)"
    );
  });

  it('should create "OR" expression', () => {
    const expression = ConditionExpression.whereKey("name")
      .equals("bill")
      .or.key("name")
      .equals("kevin")
      .or.key("name")
      .equals("frank");
    expect(expression.toString()).toEqual(
      "#name = :name0 OR #name = :name1 OR #name = :name2"
    );
  });

  it('should create "NOT" expression', () => {
    const expression = ConditionExpression.not.key("name").equals("123");
    expect(expression.toString()).toEqual("NOT #name = :name0");
  });

  it('should create "AND" with "NOT" expression', () => {
    const expression = ConditionExpression.whereKey("name")
      .equals("henry")
      .and.not.key("id")
      .equals("345");
    expect(expression.toString()).toEqual("#name = :name0 AND NOT #id = :id0");
  });

  it("should create parenthetical expression", () => {
    const expression = ConditionExpression.openParens
      .key("name")
      .equals("henry").closeParens;
    expect(expression.toString()).toEqual("( #name = :name0 )");
  });

  it("should create complex parenthetical expression", () => {
    let expression = ConditionExpression.not.openParens
      .key("firstName")
      .equals("henry")
      .and.key("lastName")
      .equals("smith").closeParens;
    expect(expression.toString()).toEqual(
      "NOT ( #firstName = :firstName0 AND #lastName = :lastName0 )"
    );

    expression = ConditionExpression.not.openParens.openParens
      .key("firstName")
      .equals("henry")
      .and.key("lastName")
      .equals("smith")
      .closeParens.or.key("firstName")
      .equals("bill").closeParens;
    expect(expression.toString()).toEqual(
      "NOT ( ( #firstName = :firstName0 AND #lastName = :lastName0 ) OR #firstName = :firstName1 )"
    );

    expression = ConditionExpression.openParens
      .key("firstName")
      .equals("henry")
      .and.key("lastName")
      .equals("smith")
      .closeParens.or.openParens.key("firstName")
      .equals("billy")
      .and.key("lastName")
      .equals("bob").closeParens;
    expect(expression.toString()).toEqual(
      "( #firstName = :firstName0 AND #lastName = :lastName0 ) OR ( #firstName = :firstName1 AND #lastName = :lastName1 )"
    );
  });

  it("should throw error when out of order", () => {
    expect(() => ConditionExpression.whereKey("name").or.validate()).toThrow(
      '"or" cannot come right after argument "name"'
    );
    expect(() => ConditionExpression.whereKey("name").and.validate()).toThrow(
      '"and" cannot come right after argument "name"'
    );
    expect(() =>
      ConditionExpression.whereKey("name").attribute("user").validate()
    ).toThrow(`"attribute" cannot come right after argument "name"`);
    expect(() =>
      ConditionExpression.whereKey("name").key("userId").validate()
    ).toThrow(`"key" cannot come right after argument "name"`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).and.or.validate()
    ).toThrow(`Invalid expression`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).not.validate()
    ).toThrow(`Invalid expression`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).equals(3).validate()
    ).toThrow(`Attribute name required before "="`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).isGreaterThan(3).validate()
    ).toThrow(`Attribute name required before ">"`);
    expect(() =>
      ConditionExpression.whereKey("name")
        .equals(1)
        .isGreaterOrEqualTo(3)
        .validate()
    ).toThrow(`Attribute name required before ">="`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).isLessThan(3).validate()
    ).toThrow(`Attribute name required before "<"`);
    expect(() =>
      ConditionExpression.whereKey("name")
        .equals(1)
        .isLessOrEqualTo(3)
        .validate()
    ).toThrow(`Attribute name required before "<="`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).isBetween(3, 4).validate()
    ).toThrow(`Attribute name required before "BETWEEN"`);
    expect(() =>
      ConditionExpression.whereKey("name")
        .equals(1)
        .beginsWith("five")
        .validate()
    ).toThrow(`Attribute name required before "begins_with"`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).contains("five").validate()
    ).toThrow(`Attribute name required before "contains"`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).exists.validate()
    ).toThrow(`Attribute name required before "attribute_exists"`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).notExists.validate()
    ).toThrow(`Attribute name required before "attribute_not_exists"`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).isType("S").validate()
    ).toThrow(`Attribute name required before "attribute_type"`);
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).size.validate()
    ).toThrow(`Attribute name required before "size"`);
    expect(() => ConditionExpression.openParens.validate()).toThrow(
      `Invalid expression`
    );
    expect(() =>
      ConditionExpression.openParens.key("name").equals(1).validate()
    ).toThrow(`Invalid expression`);
    expect(() => ConditionExpression.openParens.closeParens.validate()).toThrow(
      `Invalid expression`
    );
    expect(() =>
      ConditionExpression.whereKey("name").equals(1).closeParens.validate()
    ).toThrow(`Invalid expression`);
  });
});
