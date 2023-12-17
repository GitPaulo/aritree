export enum operators {
  SUBTRACTION = '-',
  ADDITION = '+',
  DIVISION = '/',
  MULTIPLICATION = '*',
  POWER = '^',
}

export type token = (operators | '(' | ')');

export const precedence: { [key in operators]: number } = {
  [operators.POWER]: 4,
  [operators.MULTIPLICATION]: 3,
  [operators.DIVISION]: 3,
  [operators.ADDITION]: 2,
  [operators.SUBTRACTION]: 2
};

export const associativity: { [key in operators]: 'Left' | 'Right' } = {
  [operators.POWER]: "Right",
  [operators.MULTIPLICATION]: "Left",
  [operators.DIVISION]: "Left",
  [operators.ADDITION]: "Left",
  [operators.SUBTRACTION]: "Left"
};

export const isOperator = (token: string): boolean => {
  return Object.values(operators).includes(token as operators);
};

export function stringToPostfix(infix: string): string {
  const noSpaceInfix = infix.replace(/\s+/g, '');
  const stack: token[] = [];
  let postfix = "";

  let i = 0;
  while (i < noSpaceInfix.length) {
    const currentChar = noSpaceInfix[i];

    // If the character is a number or a decimal point, keep reading until you hit a non-number/decimal.
    if (/\d|\./.test(currentChar)) {
      let number = currentChar;
      while (i + 1 < noSpaceInfix.length && /\d|\./.test(noSpaceInfix[i + 1])) {
        number += noSpaceInfix[++i];
      }
      postfix += number + " ";
    } else if (isOperator(currentChar)) {
      // Process operators
      while (
        stack.length > 0 &&
        isOperator(stack[stack.length - 1]) &&
        (
          (associativity[currentChar as operators] === "Left" && precedence[currentChar as operators] <= precedence[stack[stack.length - 1] as operators]) ||
          (associativity[currentChar as operators] === "Right" && precedence[currentChar as operators] < precedence[stack[stack.length - 1] as operators])
        )
      ) {
        postfix += stack.pop() + " ";
      }
      stack.push(currentChar as operators);
    } else if (currentChar === "(") {
      stack.push('(');
    } else if (currentChar === ")") {
      // Process right parentheses
      while (stack.length > 0 && stack[stack.length - 1] !== "(") {
        postfix += stack.pop() + " ";
      }
      stack.pop(); // Pop the left parenthesis
    }
    i++;
  }

  // Pop any remaining operators from the stack
  while (stack.length > 0) {
    const top = stack.pop();
    if (top !== '(') {
      postfix += top + " ";
    }
  }

  return postfix.trim();
}
