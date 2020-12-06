import UpdateExpression from "../UpdateExpression";

describe("Dynamo UpdateExpression", () => {
  it('should create "SET" expression', () => {
    const update = UpdateExpression.set("id", "1234");
    expect(update.expression).toEqual("SET #id = :id0");
    expect(update.attributeNames).toHaveProperty("#id", "id");
    expect(update.attributeValues).toHaveProperty(":id0", "1234");
  });

  it('should create "SET if_not_exists" expression', () => {
    const update = UpdateExpression.setIfNotExists("id", "1234");
    expect(update.expression).toEqual("SET #id = if_not_exists(#id, :id0)");
    expect(update.attributeNames).toHaveProperty("#id", "id");
    expect(update.attributeValues).toHaveProperty(":id0", "1234");
  });

  it('should create "SET if_not_exists" expression checking for existance of another attribute', () => {
    const update = UpdateExpression.setIfNotExists("id", "1234", "userId");
    expect(update.expression).toEqual("SET #id = if_not_exists(#userId, :id0)");
    expect(update.attributeNames).toHaveProperty("#id", "id");
    expect(update.attributeNames).toHaveProperty("#userId", "userId");
    expect(update.attributeValues).toHaveProperty(":id0", "1234");
  });

  it("should create increment expression", () => {
    const update = new UpdateExpression().increment("value", 5);
    expect(update.expression).toEqual("SET #value = #value + :value0");
    expect(update.attributeNames).toHaveProperty("#value", "value");
    expect(update.attributeValues).toHaveProperty(":value0", 5);
  });

  it("should create decrement expression", () => {
    const update = new UpdateExpression().decrement("value", 4);
    expect(update.expression).toEqual("SET #value = #value - :value0");
    expect(update.attributeNames).toHaveProperty("#value", "value");
    expect(update.attributeValues).toHaveProperty(":value0", 4);
  });

  it('should create "list_append" expression', () => {
    const update = new UpdateExpression().appendToList("myList", [1, 2, 3]);
    expect(update.expression).toEqual(
      "SET #myList = list_append(#myList, :myList0)"
    );
    expect(update.attributeNames).toHaveProperty("#myList", "myList");
    expect(update.attributeValues).toHaveProperty(":myList0", [1, 2, 3]);
  });

  it('should create "list_append" expression, appending to the beginning of the list', () => {
    const update = new UpdateExpression().appendToBeginingOfList("myList", [
      1,
      2,
      3,
    ]);
    expect(update.expression).toEqual(
      "SET #myList = list_append(:myList0, #myList)"
    );
    expect(update.attributeNames).toHaveProperty("#myList", "myList");
    expect(update.attributeValues).toHaveProperty(":myList0", [1, 2, 3]);
  });

  it('should create "ADD" expression', () => {
    const update = new UpdateExpression().addToSet("mySet", [1, 2, 3]);
    expect(update.expression).toEqual("ADD #mySet :mySet0");
    expect(update.attributeNames).toHaveProperty("#mySet", "mySet");
    expect(update.attributeValues).toHaveProperty(":mySet0", [1, 2, 3]);
  });

  it('should create "DELETE" expression', () => {
    const update = new UpdateExpression().deleteFromSet("mySet", [1, 2, 3]);
    expect(update.expression).toEqual("DELETE #mySet :mySet0");
    expect(update.attributeNames).toHaveProperty("#mySet", "mySet");
    expect(update.attributeValues).toHaveProperty(":mySet0", [1, 2, 3]);
  });

  it('should create "REMOVE" expression', () => {
    const update = new UpdateExpression().remove("name");
    expect(update.expression).toEqual("REMOVE #name");
    expect(update.attributeNames).toHaveProperty("#name", "name");
  });

  it("should create remove from list expression", () => {
    const update = new UpdateExpression().removeFromList("myList", 2);
    expect(update.expression).toEqual("REMOVE #myList[2]");
    expect(update.attributeNames).toHaveProperty("#myList", "myList");
  });

  it("should create complex expression", () => {
    const update = UpdateExpression.set("email", "mylittlepony@bronies.us")
      .set("name", "pete")
      .remove("city")
      .setIfNotExists("state", "Jupiter")
      .remove("country")
      .addToSet("mySet", [1, 2, 3])
      .deleteFromSet("mySet", [4, 5, 6]);
    expect(update.expression).toEqual(
      "SET #email = :email0, #name = :name0, #state = if_not_exists(#state, :state0) REMOVE #city, #country ADD #mySet :mySet0 DELETE #mySet :mySet1"
    );

    expect(update.attributeNames).toHaveProperty("#email", "email");
    expect(update.attributeNames).toHaveProperty("#name", "name");
    expect(update.attributeNames).toHaveProperty("#city", "city");
    expect(update.attributeNames).toHaveProperty("#state", "state");
    expect(update.attributeNames).toHaveProperty("#country", "country");
    expect(update.attributeNames).toHaveProperty("#mySet", "mySet");

    expect(update.attributeValues).toHaveProperty(
      ":email0",
      "mylittlepony@bronies.us"
    );
    expect(update.attributeValues).toHaveProperty(":name0", "pete");
    expect(update.attributeValues).toHaveProperty(":state0", "Jupiter");
    expect(update.attributeValues).toHaveProperty(":mySet0", [1, 2, 3]);
    expect(update.attributeValues).toHaveProperty(":mySet1", [4, 5, 6]);
  });
});
