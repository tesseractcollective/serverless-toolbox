export function validateConditionExpression(expression: string): boolean {
  // operand >=|<=|<>|=|<|> operand
  const comparisonRegex = /^(#\S+) (>=|<=|<>|=|<|>) ([#:]\S+)$/;
  if (expression.match(comparisonRegex) !== null) {
    return true;
  }

  // operand BETWEEN operand AND operand
  const betweenRegex = /^(#\S+) BETWEEN ([#:]\S+) AND ([#:]\S+)$/;
  if (expression.match(betweenRegex) !== null) {
    return true;
  }

  // operand IN (operand (',' operand (, ...)))
  const inRegex = /^(#\S+) IN \((([#:]\S+)|([#:]\S+), )+\)$/;
  if (expression.match(inRegex) !== null) {
    return true;
  }

  // attribute_exists (path)
  const existsRegex = /^attribute_exists \((#\S+)\)$/;
  if (expression.match(existsRegex) !== null) {
    return true;
  }

  // attribute_not_exists (path)
  const notExistsRegex = /^attribute_not_exists \((#\S+)\)$/;
  if (expression.match(notExistsRegex) !== null) {
    return true;
  }

  // attribute_type (path, type)
  const typeRegex = /^attribute_type \((#\S+), (:\S+)\)$/;
  if (expression.match(typeRegex) !== null) {
    return true;
  }

  // begins_with (path, substr)
  const beginsWithRegex = /^begins_with \((#\S+), (:\S+)\)$/;
  if (expression.match(beginsWithRegex) !== null) {
    return true;
  }

  // contains (path, operand)
  const containsRegex = /^contains \((#\S+), (:\S+)\)$/;
  if (expression.match(containsRegex) !== null) {
    return true;
  }

  // size (path)
  const sizeRegex = /^size \((#\S+)\)$/;
  if (expression.match(sizeRegex) !== null) {
    return true;
  }

  // ( condition )
  const parenthesesRegex = /^\( (.+) \)$/;
  const parenthesesFound = expression.match(parenthesesRegex);
  if (parenthesesFound && parenthesesFound[1]) {
    const insideParentheses = parenthesesFound[1];
    // don't evaluate if there are parenthetical conditions
    // joined by a conjunction like ( condition ) AND ( condition )
    // or it's otherwise malformed
    const closingWithoutMatchingOpeningParensRegex = /^[^(]+\).+/;
    if (
      insideParentheses.match(closingWithoutMatchingOpeningParensRegex) === null
    ) {
      return validateConditionExpression(insideParentheses);
    }
  }

  // NOT condition
  const notRegex = /^NOT (.+)$/;
  const notFound = expression.match(notRegex);
  if (notFound && notFound[1]) {
    return validateConditionExpression(notFound[1]);
  }

  // condition OR condition
  const orRegex = /(.+) OR (.+)/;
  const orFound = expression.match(orRegex);
  if (orFound && orFound[1] && orFound[2]) {
    return (
      validateConditionExpression(orFound[1]) &&
      validateConditionExpression(orFound[2])
    );
  }

  // condition AND condition
  const andEndingWithBetweenConditionRegex = /(.+) AND (#\S+ BETWEEN [#:]\S+ AND [#:]\S+)$/;
  const andEndingWithBetweenConditionFound = expression.match(
    andEndingWithBetweenConditionRegex
  );
  if (
    andEndingWithBetweenConditionFound &&
    andEndingWithBetweenConditionFound[1] &&
    andEndingWithBetweenConditionFound[2]
  ) {
    return (
      validateConditionExpression(andEndingWithBetweenConditionFound[1]) &&
      validateConditionExpression(andEndingWithBetweenConditionFound[2])
    );
  }
  const andRegex = /(.+) AND (.+)/;
  const andFound = expression.match(andRegex);
  if (andFound && andFound[1] && andFound[2]) {
    return (
      validateConditionExpression(andFound[1]) &&
      validateConditionExpression(andFound[2])
    );
  }

  throw new Error(expression);
}
