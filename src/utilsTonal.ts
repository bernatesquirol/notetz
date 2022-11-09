import { Chord, Note, Scale } from "@tonaljs/tonal";
import tree from "./tree.json";
// import dagre from "dagre";
// const dagreGraph = new dagre.graphlib.Graph();
// dagreGraph.setDefaultEdgeLabel(() => ({}));
// const getLayoutedElements = (nodes, edges, direction = "TB", nodeWidth, nodeHeight) => {
//   const isHorizontal = direction === "LR";
//   dagreGraph.setGraph({ rankdir: direction });

//   nodes.forEach((node) => {
//     dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
//   });

//   edges.forEach((edge) => {
//     dagreGraph.setEdge(edge.source, edge.target);
//   });

//   dagre.layout(dagreGraph);

//   nodes.forEach((node) => {
//     const nodeWithPosition = dagreGraph.node(node.id);
//     node.targetPosition = isHorizontal ? "left" : "top";
//     node.sourcePosition = isHorizontal ? "right" : "bottom";

//     // We are shifting the dagre node position (anchor=center center) to the top left
//     // so it matches the React Flow node anchor point (top left).
//     node.position = {
//       x: nodeWithPosition.x - nodeWidth / 2,
//       y: nodeWithPosition.y - nodeHeight / 2,
//     };

//     return node;
//   });

//   return { nodes, edges };
// };
// const createTreeChords = (listOfChords)=>{
//     listOfChords.
// }
export const createMapChords = (scale, key, nodeWidth, nodeHeight)=>{
    let originNode = ({ id: scale, data: { scale, root: key }, position:{x:0, y: 0}, type: "scaleNode" });
    let chordsNode = Scale.scaleChords(scale).map((c, i, list)=>{
        let angle = 2*Math.PI*i/list.length
        let chord = Chord.getChord(c,key)
        return ({ 
            id: chord.symbol, 
            data: { chord:c, key, notes: chord.notes }, 
            position:{x:4*nodeWidth*Math.cos(angle), y: nodeWidth*Math.sin(angle)}, 
            type: "chordNode" })
    })
    let nodes = [originNode, ...chordsNode]
    let edges = chordsNode.map(c=>({ id: `${scale}-${c.id}`, source: `${scale}`, target: `${c.id}` }));
    //({ id: scale, data: { scale, root: key }, position:{x:0, y: 0}, type: "scaleNode" });
    return {nodes, edges}
}
export const createDefinitiveMap = (scale, key, nodeWidth, nodeHeight)=>{
  let originNode = ({ id: scale, data: { scale, root: key }, position:{x:0, y: 0}, type: "scaleNode" });
  let modeChroma = Scale.get(scale).chroma;
  let intChroma = parseInt(modeChroma, 2);
  let nodesDict = {}
  // 
  Scale.modeNames(scale).forEach(([interval, mode]: any) => {
      // check modes correctly!! split is shit
      if (scale !== mode) {
        let chroma = Scale.get(mode).chroma;
        // let dist = levenshtein.get(modeChroma, chroma)
        let intMode = parseInt(chroma, 2);
        if (!nodesDict['modesSameKey']) nodesDict['modesSameKey'] = []
        nodesDict['modesSameKey'].push({ id: `${mode}-${key}`, data:{scale:mode, root:key, intMode},  type: "scaleNode" })
        if (!nodesDict['modesSameNotes']) nodesDict['modesSameNotes'] = []
        nodesDict['modesSameNotes'].push({ id:`${mode}-${Note.transpose(key, interval)}`,data:{scale:mode, root:Note.transpose(key, interval), intMode}, type: "scaleNode" })
      // if (intMode > intChroma) {
      }
      
    });
  

  // north is S i S is N
  
  nodesDict['modesSameKey'].sort(
    ({ data :{ intMode: intModeA }}, { data : {intMode: intModeB }}) => intModeA - intModeB
  )
  nodesDict['modesSameNotes'].sort(
    ({ data:{intMode: intModeA }}, { data:{intMode: intModeB }}) => intModeA - intModeB
  )
  nodesDict['modesSameKey'] = nodesDict['modesSameKey'].map((n:any, i)=>({
    ...n,
    position:{
      x: originNode.position.x*2,
      y: originNode.position.y + nodeHeight * 1.2 * (i + 1)
    }
  }))
  nodesDict['modesSameNotes'] = nodesDict['modesSameKey'].map((n:any, i)=>({
    ...n,
    position:{
      x: originNode.position.x*3,
      y: originNode.position.y + nodeHeight * 1.2 * (i + 1)
    }
  }))
  // let nodesNorth = N.map((p: any, i) =>
  //   ({
  //     id: p.mode,
  //     type: "modeNode",
  //     data: { scale: p.mode, root: key, interval: p.interval },
  //     position: {
  //       x: originNode.position.x,
  //       y: originNode.position.y + nodeHeight * 1.2 * (i + 1),
  //     },
  //   })
  // );
  // let S = modes.S;
  // S.sort(
  //   ({ intMode: intModeA }, { intMode: intModeB }) => intModeB - intModeA
  // );
  // let nodesSouth = S.map((p, i) =>
  //   ({
  //     id: p.mode,
  //     type: "modeNode",
  //     data: { scale: p.mode, root: key, interval: p.interval },
  //     position: {
  //       x: originNode.position.x,
  //       y: originNode.position.y - nodeHeight * 1.2 * (i + 1),
  //     },
  //   })
  // );
  let newNodes = Object.values(nodesDict).flat();
  // newNodes.forEach(({ id }) => {
  //   let { children, parents } = tree[id];
  //   let edgesChildren = children.map((c) => {
  //     return { id: `${id}-${c}`, source: `${id}`, target: `${c}` };
  //   });
  //   let edgesParents = parents.map((p) => {
  //     return { id: `${p}-${id}`, source: `${p}`, target: `${id}` };
  //   });
  //   // edges = [...edges, ...edgesChildren, ...edgesParents];
  // });
  let nodes = [originNode, ...newNodes];
  return {nodes}
}
export const createMapScales = (scale, key, nodeWidth, nodeHeight)=>{
    let { children, parents } = tree[scale];
    let originNode = ({ id: scale, data: { scale, root: key }, position:{x:0, y: 0}, type: "scaleNode" });
    let childrenNodes = children.map((k, i, list) =>
      ({
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
      ({ id: k, 
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
      ({
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
      ({
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
    return {nodes, edges}
}