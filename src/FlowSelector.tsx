import ReactFlow, { Controls, Background, Handle, NodeTypes, useReactFlow, ReactFlowProvider } from "reactflow";
import tree from "./tree.json";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Note, Scale } from "@tonaljs/tonal";
import { autoContextProviderFactory } from "./utils";
const nodeWidth = 172;
const nodeHeight = 36;
const styleNodes: any = {
  float: "left",
  border: "1px solid black",
  borderRadius: 5,
  width: nodeWidth,
  height: nodeHeight,
  textAlign: "center",
};
// import levenshtein from 'fast-levenshtein'
const ScaleNode = memo(({ id, data, targetPosition, sourcePosition }: any) => {
  return (
    <>
      <Handle type="target" position={targetPosition} />
      <div
        style={styleNodes}
        onClick={() => data?.setContext({ key: data.root, scale: data.scale })}
      >
        {data.root ? `${data.root} ` : ""}
        {data.scale}
      </div>
      <Handle type="source" position={sourcePosition} />
    </>
  );
});
const ModeNode = memo(({ id, data, targetPosition, sourcePosition }: any) => {
  return (
    <>
      <Handle type="target" position={targetPosition} />
      <div
        style={{ ...styleNodes, width: nodeWidth / 2 }}
        onClick={() => data?.setContext({ key: data.root, scale: data.scale })}
      >
        {data.root ? `${data.root} ` : ""}
        {data.scale}
      </div>
      <div
        style={{ ...styleNodes, width: nodeWidth / 2 }}
        onClick={() =>
          data?.setContext({
            key: Note.transpose(data.root, data.interval),
            scale: data.scale,
          })
        }
      >
        {data.root ? `${Note.transpose(data.root, data.interval)} ` : ""}
        {data.scale}
      </div>
      <Handle type="source" position={sourcePosition} />
    </>
  );
});
const ChordNode = memo(({ id, data, targetPosition, sourcePosition }: any) => {
  return (
    <>
      <Handle type="target" position={targetPosition} />
      <div style={{ border: "1px black", borderRadius: 5 }}>{data.label}</div>
      <Handle type="source" position={sourcePosition} />
    </>
  );
});
const nodeTypes: NodeTypes = {
  modeNode: ModeNode,
  scaleNode: ScaleNode,
  chordNode: ChordNode,
};
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? "left" : "top";
    node.sourcePosition = isHorizontal ? "right" : "bottom";

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};
// const initialNodes = Object.keys(tree).map((k)=>({id:k, data:{label:k}}))
// const initialEdges = Object.entries(tree).map(([k,v])=>{
//   return v.childs.map(c=>{
//     return {id:`${k}-${c}`, source:`${k}`, target:`${c}`}
//   })
// }).flat()
// const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
//   initialNodes,
//   initialEdges,
//   'LR'
// );

export const FlowSelectorContext = autoContextProviderFactory<{
  mode?: string;
  key?: string;
}>({ mode: undefined, key: undefined }, "FlowSelector");

const FlowSelector = ({ width, height }) => {
  const { scale, key, setContext } =
    FlowSelectorContext.useFlowSelectorContext();
  const createNode = useCallback(
    function<T extends { data?: any } & Record<string, any>>(n: T){
      return {
        ...n,
        data: { ...(n.data || {}), setContext },
        targetPosition: "left",
        sourcePosition: "right",
      };
    },
    [setContext]
  );
  const { nodes, edges } = useMemo(() => {
    let { children, parents } = tree[scale];
    let originNode = createNode({ id: scale, data: { scale, root: key }, position:{x:0, y: 0}, type: "scaleNode" });
    let childrenNodes = children.map((k, i, list) =>
      createNode({
        id: k,
        data: { scale: k, root: key },
        position: {
          x: originNode.position.x+nodeWidth*1.5,
          y: originNode.position.y+(i*nodeHeight*1.5)-(list.length*nodeHeight/2)
        },
        type: "scaleNode",
      })
    );
    
    let parentsNodes = parents.map((k, i, list) =>
      createNode({ id: k, 
        data: { scale: k, root: key },
        position: {
          x: originNode.position.x-nodeWidth*1.5,
          y: originNode.position.y+i*nodeHeight*1.5-(list.length*nodeHeight/2)
        },
        type: "scaleNode" 
      })
    );
    
    let nodes = [...childrenNodes, ...parentsNodes, originNode];
    // console.log(nodesRaw[0])
    let edgesChildren = children.map((c) => {
      return { id: `${scale}-${c}`, source: `${scale}`, target: `${c}` };
    });
    let edgesParents = parents.map((p) => {
      return { id: `${p}-${scale}`, source: `${p}`, target: `${scale}` };
    });
    let edges = [...edgesChildren, ...edgesParents];
    // let {nodes, edges} = getLayoutedElements(
    //   nodesRaw,
    //   edgesRaw,
    //   'LR'
    // );
    let modeChroma = Scale.get(scale).chroma;
    let intChroma = parseInt(modeChroma, 2);
    let modes = Scale.modeNames(scale).reduce(
      (acc: any, [interval, mode]: any) => {
        // check modes correctly!! split is shit
        if (scale === mode) return acc;
        let chroma = Scale.get(mode).chroma;
        // let dist = levenshtein.get(modeChroma, chroma)
        let intMode = parseInt(chroma, 2);
        if (intMode > intChroma) {
          // if (!acc.N[dist]) acc.N[dist] = []
          acc.N.push({ mode, interval, intMode });
        } else {
          // if (!acc.S[dist]) acc.S[dist] = []
          acc.S.push({ mode, interval, intMode });
        }
        return acc;
      },
      { N: [], S: [] }
    );
    // 
    // north is S i S is N
    let N = modes.N;
    N.sort(
      ({ intMode: intModeA }, { intMode: intModeB }) => intModeA - intModeB
    );
    let nodesNorth = N.map((p: any, i) =>
      createNode({
        id: p.mode,
        type: "modeNode",
        data: { scale: p.mode, root: key, interval: p.interval },
        position: {
          x: originNode.position.x,
          y: originNode.position.y + nodeHeight * 1.2 * (i + 1),
        },
      })
    );
    let S = modes.S;
    S.sort(
      ({ intMode: intModeA }, { intMode: intModeB }) => intModeB - intModeA
    );
    let nodesSouth = S.map((p, i) =>
      createNode({
        id: p.mode,
        type: "modeNode",
        data: { scale: p.mode, root: key, interval: p.interval },
        position: {
          x: originNode.position.x,
          y: originNode.position.y - nodeHeight * 1.2 * (i + 1),
        },
      })
    );
    let newNodes = [...nodesNorth, ...nodesSouth];
    newNodes.forEach(({ id }) => {
      let { children, parents } = tree[id];
      let edgesChildren = children.map((c) => {
        return { id: `${id}-${c}`, source: `${id}`, target: `${c}` };
      });
      let edgesParents = parents.map((p) => {
        return { id: `${p}-${id}`, source: `${p}`, target: `${id}` };
      });
      edges = [...edges, ...edgesChildren, ...edgesParents];
    });
    nodes = [...nodes, ...newNodes];
    return { nodes, edges };
  }, [scale, key, createNode]);
  
  return (
    <div style={{ height, width }}>
      <ReactFlow
       nodes={nodes} 
       edges={edges} 
       nodeTypes={nodeTypes}
       >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
const WrappedFlow = (props)=><ReactFlowProvider>
  <FlowSelector {...props}/>
</ReactFlowProvider>
// const useFitView = (...deps)=>{
//   const { fitView } = useReactFlow();
//   useEffect(()=>{
//     fitView()
//   },[deps])
// }
export default WrappedFlow;
