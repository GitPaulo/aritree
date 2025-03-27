export enum operators {
  SUBTRACTION = '-',
  ADDITION = '+',
  DIVISION = '/',
  MULTIPLICATION = '*',
  POWER = '^',
}

export enum specials {
  LEFT_PARENTHESIS = '(',
  RIGHT_PARENTHESIS = ')',
}

export enum associativeDirection {
  LEFT = 'left',
  RIGHT = 'right'
};

export type token = (operators | specials);

export const precedence: { [key in operators]: number } = {
  [operators.POWER]: 4,
  [operators.MULTIPLICATION]: 3,
  [operators.DIVISION]: 3,
  [operators.ADDITION]: 2,
  [operators.SUBTRACTION]: 2
};

export const associativity: { [key in operators]: associativeDirection } = {
  [operators.POWER]: associativeDirection.RIGHT,
  [operators.MULTIPLICATION]: associativeDirection.LEFT,
  [operators.DIVISION]: associativeDirection.LEFT,
  [operators.ADDITION]: associativeDirection.LEFT,
  [operators.SUBTRACTION]: associativeDirection.LEFT
};

export const isOperator = (token: string): token is operators => {
  return Object.values(operators).includes(token as operators);
};

export const isSpecial = (token: string): token is specials => {
  return Object.values(specials).includes(token as specials);
};

export const isToken = (char: string): char is token => {
  return isOperator(char) || isSpecial(char); // number, operators, left parentheses, right parentheses
};

export function stringToPostfix(infix: string): string {
  if (!infix) {
    throw new Error('Empty or invalid infix string');
  }

  const noSpaceInfix = infix.replace(/\s+/g, '');
  const stack: token[] = [];
  const peekStack = () => stack[stack.length - 1];

  let i = 0;
  let postfix = "";
  while (i < noSpaceInfix.length) {
    const currentChar = noSpaceInfix[i];
    const digitOrPoint = /\d|\./;

    // If the character is a number or a decimal point, keep reading until you hit a non-number/decimal.
    if (digitOrPoint.test(currentChar)) {
      let number = currentChar;
      while (i + 1 < noSpaceInfix.length && digitOrPoint.test(noSpaceInfix[i + 1])) {
        number += noSpaceInfix[++i];
      }
      postfix += number + " ";
    } else if (isOperator(currentChar)) {
      while (stack.length > 0) {
        const peekedChar = peekStack();
        if (isOperator(peekedChar) &&
          (
            (associativity[currentChar as operators] === associativeDirection.LEFT && precedence[currentChar as operators] <= precedence[peekedChar as operators]) || // Cast as operators
            (associativity[currentChar as operators] === associativeDirection.RIGHT && precedence[currentChar as operators] < precedence[peekedChar as operators]) // Cast as operators
          )) {
          postfix += stack.pop() + " ";
        } else {
          break;
        }
      }
      stack.push(currentChar as operators); // Corrected casting
    } else if (isSpecial(currentChar)) {
      if (currentChar === specials.LEFT_PARENTHESIS) {
        stack.push(currentChar);
      } else if (currentChar === specials.RIGHT_PARENTHESIS) {
        // Moved peekedChar inside the loop for fresh stack top reference
        while (stack.length > 0 && peekStack() !== specials.LEFT_PARENTHESIS) {
          postfix += stack.pop() + " ";
        }

        if (stack.length === 0) {
          throw new Error('Mismatched parentheses');
        }

        stack.pop(); // Pop the left parenthesis
      }
    } else {
      throw new Error(`Invalid character: ${currentChar}`);
    }
    i++;
  }

  // Pop any remaining operators from the stack
  while (stack.length > 0) {
    if (peekStack() === specials.LEFT_PARENTHESIS) {
      throw new Error('Mismatched parentheses');
    }

    postfix += stack.pop() + " "; // Removed unnecessary check as parentheses should not remain
  }

  return postfix.trim();
}
