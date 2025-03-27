<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import dagre from 'cytoscape-dagre';
	import {
		stringToPostfix,
		operators,
		precedence,
		associativity,
		isOperator
	} from '../lib/stringToPostfix';
	import type { Core, NodeDefinition, EdgeDefinition } from 'cytoscape';
	import { initializeStores, getDrawerStore, Drawer } from '@skeletonlabs/skeleton';

	initializeStores();

	let cy: Core;
	let cyContainer: HTMLElement;
	let postfixExpression = '';
	let expressionHasError = false;
	let expressionErrorMessage = '';
	let drawerStore = getDrawerStore();

	const operatorList = Object.values(operators);

	onMount(() => {
		cytoscape.use(dagre);
	});

	function openRulesDrawer() {
		drawerStore.open({
			position: 'top'
		});
	}

	function createCytoscape(data: { nodes: NodeDefinition[]; edges: EdgeDefinition[] }) {
		cy = cytoscape({
			container: cyContainer,
			elements: [...data.nodes, ...data.edges],
			layout: {
				name: 'dagre'
			},
			style: [
				{
					selector: 'node',
					style: {
						'background-color': '#ffffff', // Nodes white
						color: '#000000', // Label color black
						'text-valign': 'center',
						'text-halign': 'center',
						'text-wrap': 'ellipsis', // abbreviate long labels
						'text-max-width': '40px',
						label: 'data(label)',
						'border-width': 1,
						'border-color': '#888888'
					}
				},
				{
					selector: 'edge',
					style: {
						width: 2,
						'line-color': '#ccc',
						'target-arrow-color': '#ccc',
						'target-arrow-shape': 'triangle'
					}
				}
			]
		});
	}

	function createGraphDataFromPostfix(postfixExpression: string): {
		nodes: NodeDefinition[];
		edges: EdgeDefinition[];
	} {
		const stack: string[] = [];
		const nodes: NodeDefinition[] = [];
		const edges: EdgeDefinition[] = [];
		const tokens = postfixExpression.split(' ');

		tokens.forEach((token, index) => {
			if (isOperator(token)) {
				const rightChild = stack.pop();
				const leftChild = stack.pop();
				const nodeId = `node-${index}`;

				nodes.push({ data: { id: nodeId, label: token } });

				if (leftChild) {
					edges.push({ data: { source: nodeId, target: leftChild } });
				}

				if (rightChild) {
					edges.push({ data: { source: nodeId, target: rightChild } });
				}

				stack.push(nodeId);
			} else {
				const nodeId = `node-${index}`;
				nodes.push({ data: { id: nodeId, label: token } });
				stack.push(nodeId);
			}
		});

		return { nodes, edges };
	}

	function validateExpression(input: string): void {
		const cleaned = input.replace(/\s+/g, '');

		if (!cleaned.length) {
			throw new Error('Expression cannot be empty.');
		}

		// Invalid characters (only digits, operators, parentheses, decimal points allowed)
		if (/[^0-9+\-*/().]/.test(cleaned)) {
			throw new Error('Invalid expression: contains invalid characters.');
		}

		// Empty parentheses ()
		if (/\(\)/.test(cleaned)) {
			throw new Error('Invalid expression: empty parentheses detected.');
		}

		// Multiple decimal points in a single number (e.g., 1..2 or 3.4.5)
		if (/\d*\.\d*\./.test(cleaned)) {
			throw new Error('Invalid expression: invalid number format.');
		}

		// Operators immediately before or after parentheses (e.g., "(+", "+)")
		if (/\([\+\*\/]/.test(cleaned) || /[\+\-\*\/]\)/.test(cleaned)) {
			throw new Error('Invalid expression: misplaced operator near parentheses.');
		}

		// Digit immediately before "(" or after ")" (e.g., "2(3+4)" or "(3+4)2")
		if (/\d\(/.test(cleaned) || /\)\d/.test(cleaned)) {
			throw new Error('Invalid expression: missing operator near parentheses.');
		}

		// Operator at end
		if (/[\+\-\*\/]$/.test(cleaned)) {
			throw new Error('Invalid expression: cannot end with operator.');
		}

		// Invalid consecutive operators (excluding unary minus)
		const invalidConsecutiveOperators = /([\+\*\/]{2,}|[\+\*\/]-|-[\+\*\/])/;
		if (invalidConsecutiveOperators.test(cleaned)) {
			throw new Error('Invalid expression: multiple consecutive operators.');
		}

		// Operator at start (allow unary minus at the start)
		if (/^[\+\*\/]/.test(cleaned)) {
			throw new Error('Invalid expression: cannot start with operator except unary minus.');
		}
	}

	function onExpressionChange(event: any) {
		const inputStr = event.target.value;

		try {
			validateExpression(inputStr);
			postfixExpression = stringToPostfix(inputStr);
			expressionHasError = false;
			createCytoscape(createGraphDataFromPostfix(postfixExpression));
		} catch (error: any) {
			postfixExpression = '';
			expressionHasError = true;
			expressionErrorMessage = error.message;
			if (cy) cy.elements().remove();
		}
	}
</script>

<!-- Drawer -->
<Drawer>
	<h3 class="h3 m-4">Rules</h3>
	<div class="table-container">
		<table class="table table-hover">
			<thead>
				<tr>
					<th>Operator</th>
					<th>Precedence</th>
					<th>Associativity</th>
				</tr>
			</thead>
			<tbody>
				{#each operatorList as operator}
					<tr>
						<td>{operator}</td>
						<td>{precedence[operator]}</td>
						<td>{associativity[operator]}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</Drawer>

<!--- Page -->
<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5 min-w-[30vw] p-6">
		<div class="flex items-center">
			<span class="h-20 w-20 mr-3 badge-icon variant-filled"
				><img src="favicon.png" alt="aritree" /></span
			>
			<h1 class="h1">Aritree</h1>
		</div>
		<p class="text-gray-500">Visualise your arithmetic expressions.</p>
		<div class="container space-y-3">
			<label class="label">
				<span>Expression</span>
				<input class="input" type="text" placeholder="1+2*3" on:input={onExpressionChange} />
			</label>
			{#if expressionHasError}
				<aside class="alert variant-ghost-error">
					<div class="alert-message">
						<h3 class="h3">Expression Error</h3>
						<p>{expressionErrorMessage}</p>
					</div>
				</aside>
			{/if}
			<h2>Postfix Expression</h2>
			<span>{postfixExpression}</span>
			<button type="button" class="btn variant-filled" on:click={openRulesDrawer}>Rule Set</button>
		</div>
		<!--- Cytoscape container --->
		<div bind:this={cyContainer} class="cy-container"></div>
	</div>
</div>

<style>
	.cy-container {
		width: 100%;
		height: 60vh;
		max-height: 1000px;
	}
	@media (max-height: 700px) {
		.cy-container {
			height: 50vh;
		}
	}
</style>
