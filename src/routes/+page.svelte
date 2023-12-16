<script lang="ts">
	import { onMount } from 'svelte';
	import cytoscape from 'cytoscape';
	import dagre from 'cytoscape-dagre';
	import stringToPostfix from '../lib/stringToPostfix';
	import type { Core, ElementsDefinition, NodeDefinition, EdgeDefinition } from 'cytoscape';

	let cy: Core;
	let cyContainer: HTMLElement;
	let postfixExpression = '';

	onMount(() => {
		cytoscape.use(dagre);
	});

	function createCytoscape(data: { nodes: NodeDefinition[]; edges: EdgeDefinition[] }) {
		console.log(data);
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
		postfixExpression = stringToPostfix(event.target?.value);
		createCytoscape(createGraphDataFromPostfix(postfixExpression));
	}
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="space-y-5">
		<h1 class="h1">Aritree</h1>
		<p class="text-gray-500">Visualise your arithmetic expressions.</p>
		<div>
			<label class="label">
				<span>Expression</span>
				<input class="input" type="text" placeholder="1+2*3" on:input={onExpressionChange} />
			</label>
			<h3>Postfix Expression</h3>
			<span>{postfixExpression}</span>
		</div>
		<!--- Cytoscape container --->
		<h2>Canvas</h2>
		<div bind:this={cyContainer} class="cy-container"></div>
	</div>
</div>

<style>
	.cy-container {
		width: 100%;
		height: 400px; /* Set your desired height */
	}
</style>
