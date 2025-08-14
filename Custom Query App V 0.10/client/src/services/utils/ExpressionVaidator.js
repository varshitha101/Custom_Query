// Helper: Convert infix expression array to expression tree
function buildExpressionTree(expression) {
  const operators = { AND: 2, OR: 1 };
  const stack = [];
  const opStack = [];

  function popOp() {
    const op = opStack.pop();
    const right = stack.pop();
    const left = stack.pop();
    stack.push({ type: "op", op, left, right });
  }

  for (let i = 0; i < expression.length; i++) {
    const item = expression[i];
    if (item.type === "selector") {
      stack.push({ ...item });
    } else if (item.type === "choice") {
      if (item.value === "(") {
        opStack.push("(");
      } else if (item.value === ")") {
        while (opStack.length && opStack[opStack.length - 1] !== "(") {
          popOp();
        }
        opStack.pop(); // remove '('
      } else if (item.value === "AND" || item.value === "OR") {
        while (opStack.length && opStack[opStack.length - 1] !== "(" && operators[opStack[opStack.length - 1]] >= operators[item.value]) {
          popOp();
        }
        opStack.push(item.value);
      }
    }
  }
  while (opStack.length) {
    popOp();
  }
  return stack[0];
}
// Helper: Recursively check if all Date selectors are only under AND
function checkDateAndOnly(node, parentOps = []) {
  if (!node) return { valid: true };

  if (node.type === "selector" && node.value?.selectedOption2 === "Date") {
    if (parentOps.includes("OR")) {
      return {
        valid: false,
        error: `Date question Q${node.id + 1} cannot be linked with OR operator`,
      };
    }
  }

  if (node.type === "op") {
    // Pass down the parentOps plus the current operator
    const left = checkDateAndOnly(node.left, [...parentOps, node.op]);
    if (!left.valid) return left;
    const right = checkDateAndOnly(node.right, [...parentOps, node.op]);
    if (!right.valid) return right;
  }

  return { valid: true };
}
/**
 *  Function to validate an expression array
 *  This function checks the structure and content of the expression array
 * to ensure it adheres to the expected format.
 *  It checks for:
 * - Empty expression
 * - Maximum length of 50 items
 * - Starting and ending with a valid selector
 * - Proper use of operators (AND, OR)
 * - Parentheses usage when both AND and OR operators are present
 * - Logical correctness of Date-related questions
 * - Proper nesting of parentheses
 * @param {Array} expression
 * @returns
 */
export default function validateExpression(expression) {
  // Basic validation checks
  // Check if expression is an array and has at least one item
  const operators = ["AND", "OR"];
  if (!Array.isArray(expression) || expression.length === 0) {
    return { valid: false, error: "Expression is empty" };
  }

  // Check if expression exceeds maximum length of 50 items
  if (expression.length > 50) {
    return { valid: false, error: "Expression exceeds maximum length of 50 items" };
  }

  // Expression cannot start or end with operator
  if (expression[0].type === "choice" && operators.includes(expression[0].value)) {
    return {
      valid: false,
      error: "Expression cannot start with an operator",
    };
  }
  if (expression[expression.length - 1].type === "choice" && operators.includes(expression[expression.length - 1].value)) {
    return { valid: false, error: "Expression cannot end with an operator" };
  }

  const hasDateSelector = expression.some((item) => item.type === "selector" && item.value?.selectedOption2 === "Date");
  if (hasDateSelector) {
    // If both AND and OR operators are present, parentheses must also be present
    // This is to ensure that the expression is logically correct and can be parsed correctly
    const hasBothAndOr = expression.some((item) => item.type === "choice" && item.value === "AND") && expression.some((item) => item.type === "choice" && item.value === "OR");
    const hasBothParentheses = expression.some((item) => item.type === "choice" && item.value === "(") && expression.some((item) => item.type === "choice" && item.value === ")");
    if (hasBothAndOr && !hasBothParentheses) {
      return { valid: false, error: "Expression must contain parentheses when using both AND and OR operators" };
    }
    // Check for Date-related questions
    // Date-related questions must have an AND operator either before or after them
    try {
      const tree = buildExpressionTree(expression);
      console.log(tree);

      const check = checkDateAndOnly(tree, []);
      if (!check.valid) {
        return { valid: false, error: check.error };
      }
    } catch (e) {
      console.log("Error building expression tree:", e);
      return { valid: false, error: "Invalid expression structure" };
    }
  }

  let stack = [];
  let lastType = null;

  for (let i = 0; i < expression.length; i++) {
    const item = expression[i];

    if (item.type === "choice") {
      if (item.value === "(") {
        stack.push("(");
        // '(' can follow operator or be at start
        if (lastType === "selector" || (lastType === "choice" && expression[i - 1]?.value === ")")) {
          return {
            valid: false,
            error: `Unexpected '(' after operand or ')' at position ${i + 1}`,
          };
        }
      } else if (item.value === ")") {
        if (stack.length === 0) {
          return {
            valid: false,
            error: `Unmatched ')' at position ${i + 1}`,
          };
        }
        stack.pop();
        // ')' cannot follow operator or '('
        if (lastType === "choice" && expression[i - 1].value !== ")") {
          return {
            valid: false,
            error: `Unexpected ')' after operator at position ${i + 1}`,
          };
        }
      } else if (operators.includes(item.value)) {
        // Operator cannot be at start or after another operator or '('
        if (i === 0 || (lastType === "choice" && expression[i - 1].value !== ")") || (lastType === "choice" && expression[i - 1].value === "(")) {
          return {
            valid: false,
            error: `Unexpected operator "${item.value}" at position ${i + 1}`,
          };
        }
        // Operator cannot be at end
        if (i === expression.length - 1) {
          return {
            valid: false,
            error: `Expression cannot end with operator "${item.value}"`,
          };
        }
      } else {
        return {
          valid: false,
          error: `Unknown choice value "${item.value}" at position ${i + 1}`,
        };
      }
      lastType = "choice";
    } else if (item.type === "selector") {
      // Operand cannot follow another operand or ')'
      if (lastType === "selector" || (lastType === "choice" && expression[i - 1].value === ")")) {
        return {
          valid: false,
          error: `Unexpected operand at position ${i + 1}`,
        };
      }
      lastType = "selector";
    } else {
      return {
        valid: false,
        error: `Unknown type "${item.type}" at position ${i + 1}`,
      };
    }
  }

  if (stack.length > 0) {
    return { valid: false, error: "Unmatched opening parenthesis" };
  }

  return { valid: true };
}
