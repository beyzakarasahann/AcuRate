declare module 'dagre' {
  interface GraphLabel {
    width?: number;
    height?: number;
    rankdir?: 'TB' | 'BT' | 'LR' | 'RL';
    align?: 'UL' | 'UR' | 'DL' | 'DR';
    nodesep?: number;
    edgesep?: number;
    ranksep?: number;
    marginx?: number;
    marginy?: number;
    acyclicer?: 'greedy';
    ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
    minlen?: number;
  }

  interface Edge {
    v: string;
    w: string;
    name?: string;
    value?: number;
    minlen?: number;
    weight?: number;
    width?: number;
    height?: number;
    labeloffset?: number;
    labelpos?: 'l' | 'r' | 'c';
    label?: string;
  }

  interface Node {
    v: string;
    value?: any;
    width?: number;
    height?: number;
  }

  interface Graph {
    graph(): GraphLabel;
    graph(label: GraphLabel): Graph;
    defaultEdgeLabel(): (edge: Edge) => any;
    defaultEdgeLabel(value: () => any): Graph;
    defaultEdgeLabel(value: any): Graph;
    defaultNodeLabel(): (node: Node) => any;
    defaultNodeLabel(value: () => any): Graph;
    defaultNodeLabel(value: any): Graph;
    edges(): Edge[];
    edge(id: string): any;
    edge(v: string, w: string, name?: string): any;
    edgeCount(): number;
    hasEdge(v: string, w: string, name?: string): boolean;
    hasNode(v: string): boolean;
    inEdges(v: string, u?: string): Edge[] | undefined;
    isDirected(): boolean;
    node(id: string): any;
    node(id: string, value: any): Graph;
    nodeCount(): number;
    nodes(): string[];
    outEdges(v: string, w?: string): Edge[] | undefined;
    parent(v?: string): string | undefined;
    parent(v: string, parent: string): Graph;
    predecessors(v: string): string[] | undefined;
    removeEdge(v: string, w: string, name?: string): Graph;
    removeNode(v: string): Graph;
    setDefaultEdgeLabel(callback: (edge: Edge) => any): Graph;
    setDefaultEdgeLabel(newValue: any): Graph;
    setDefaultNodeLabel(callback: (node: Node) => any): Graph;
    setDefaultNodeLabel(newValue: any): Graph;
    setEdge(v: string, w: string, value?: any, name?: string): Graph;
    setEdge(params: { v: string; w: string; name?: string; value?: any }): Graph;
    setGraph(label: GraphLabel): Graph;
    setNode(v: string, label?: any): Graph;
    setParent(v: string, parent: string): Graph;
    sinks(): string[];
    sources(): string[];
    successors(v: string): string[] | undefined;
  }

  class Graph {
    constructor(opts?: { directed?: boolean; multigraph?: boolean; compound?: boolean });
  }

  function layout(graph: Graph): void;
  function layout(graph: Graph, opts?: { nodesep?: number; edgesep?: number; ranksep?: number }): void;

  export { Graph, layout };
  export default { Graph, layout };
}


