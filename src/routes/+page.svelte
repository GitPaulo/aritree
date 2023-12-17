<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import dagre from 'cytoscape-dagre';
	import { stringToPostfix, operators, precedence, associativity } from '../lib/stringToPostfix';
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
				// the stylesheet for the graph
				{
					selector: 'node',
					style: {
						'background-color': 'grey',
						color: '#ff0000',
						'text-valign': 'center',
						'text-halign': 'center',
						label: 'data(label)'
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

	function isOperator(token: string): boolean {
		return ['+', '-', '*', '/', '^'].includes(token);
	}

	function onExpressionChange(event: any) {
		const inputStr = event.target.value;
		// Generate a string that contains all operators and parentheses
		const operatorString = operatorList.join('') + '()';
		const invalidCharactersRegex = new RegExp(
			`[^0-9${operatorString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
		);

		if (invalidCharactersRegex.test(inputStr)) {
			expressionHasError = true;
			expressionErrorMessage = 'Invalid characters';
			return;
		} else {
			expressionHasError = false;
			expressionErrorMessage = '';
		}

		postfixExpression = stringToPostfix(inputStr);
		createCytoscape(createGraphDataFromPostfix(postfixExpression));
	}
</script>

<!-- Drawer -->
<Drawer>
	<h2 class="p-4">Rules</h2>
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
				{#each operatorList as operator, i}
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
		<h1 class="h1">Aritree</h1>
		<p class="text-gray-500">Visualise your arithmetic expressions.</p>
		<div class="container">
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
			<h3>Postfix Expression</h3>
			<span>{postfixExpression}</span>
			<button type="button" class="btn variant-filled" on:click={openRulesDrawer}>Rule Set</button>
		</div>
		<!--- Cytoscape container --->
		<h2>Canvas</h2>
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
