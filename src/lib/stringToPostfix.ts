export function convertToPostfix(infix: string): string {
  const noSpaceInfix = infix.replace(/\s+/g, '');
  const stack: string[] = [];
  const operators = "-+/*^";
  const precedence: { [key: string]: number } = { "^": 4, "*": 3, "/": 3, "+": 2, "-": 2 };
  const associativity: { [key: string]: string } = { "^": "Right", "*": "Left", "/": "Left", "+": "Left", "-": "Left" };

  let postfix = "";
  let currentChar: string;
  let topOperator: string | undefined;

  for (let i = 0; i < noSpaceInfix.length; i++) {
    currentChar = noSpaceInfix[i];
    if (currentChar >= "0" && currentChar <= "9") {
      postfix += currentChar + " ";
    } else if (operators.includes(currentChar)) {
      while (stack.length > 0 && operators.includes(topOperator = stack[stack.length - 1]) &&
        ((associativity[currentChar] === "Left" && precedence[currentChar] <= precedence[topOperator!]) ||
          (associativity[currentChar] === "Right" && precedence[currentChar] < precedence[topOperator!]))) {
        postfix += stack.pop()! + " ";
      }
      stack.push(currentChar);
    } else if (currentChar === "(") {
      stack.push(currentChar);
    } else if (currentChar === ")") {
      while (stack[stack.length - 1] !== "(") {
        postfix += stack.pop()! + " ";
      }
      stack.pop();
    }
  }

  while (stack.length > 0) {
    postfix += stack.pop()! + " ";
  }

  return postfix.trim();
} 
