import { writable } from 'svelte/store';
import { operators, associativeDirection } from './stringToPostfix';

export type OperatorConfig = {
	precedence: number;
	associativity: associativeDirection;
};

export type OperatorConfigMap = { [key in operators]: OperatorConfig };

export const operatorConfig = writable<OperatorConfigMap>({
	[operators.POWER]: { precedence: 4, associativity: associativeDirection.RIGHT },
	[operators.MULTIPLICATION]: { precedence: 3, associativity: associativeDirection.LEFT },
	[operators.DIVISION]: { precedence: 3, associativity: associativeDirection.LEFT },
	[operators.ADDITION]: { precedence: 2, associativity: associativeDirection.LEFT },
	[operators.SUBTRACTION]: { precedence: 2, associativity: associativeDirection.LEFT }
});
