import { Chord, Interval, Note, Scale } from "@tonaljs/tonal";
import tree from "./tree.json";
export const getSharpValue = (noteLabel)=>{
  let simplified = Note.simplify(noteLabel)
  
  if (simplified.includes('b')){
    return `${Note.transposeBy(Interval.fromSemitones(-1))(simplified)}#`
  }
  return simplified
}
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
// function dec2bin(dec) {
//   return (dec >>> 0).toString(2);
// }
// function chromaAnd(chroma1, chroma2){
//   return dec2bin(parseInt(chroma1, 2) & parseInt(chroma2, 2))
// }
// seqChroma: 111 -> 3 notes
function getChordFactory(sequentialChroma){
  return (notes, base)=>{
    let index = notes.indexOf(base)
    let chromaLocal = [...notes.slice(index), ...notes.slice(0,index)]
    return [...sequentialChroma].map((d, i)=>d?chromaLocal[i]:null).filter(d=>d)
  }
}

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
const indexOfWithOp = (list, value, op="==")=>{
  for(let i=0; i<list.length;i++){
    switch(op){
      case ">":
        if (value > list[i]){
          return i
        } 
        break
      case "<":
        if (value < list[i]){
          return i
        } 
        break
      default:
        if (value ===list[i]){
          return i
        }
        break
    }
  }
  return list.length
}
export const createDefinitiveMap = (scale, key, nodeWidth, nodeHeight)=>{
  let originNode = ({ id: scale, data: { scale, root: key, selected: true }, position:{x:0, y: 0}, type: "scaleNode" });
  let modeChroma = Scale.get(scale).chroma;
  let intChroma = parseInt(modeChroma, 2);
  let nodesDict = {}
  let thirdFactory = getChordFactory('111')
  Scale.modeNames(scale).forEach(([interval, mode]: any) => {
      // check modes correctly!! split is shit
      if (scale !== mode) {
        let chroma = Scale.get(mode).chroma;
        // let dist = levenshtein.get(modeChroma, chroma)
        let intMode = parseInt(chroma, 2);
        if (!nodesDict['modesSameKey']) nodesDict['modesSameKey'] = []
        nodesDict['modesSameKey'].push({ id: `${mode}-${key}-modesSameKey`, data:{scale:mode, root:key, intMode},  type: "scaleNode" })
        if (!nodesDict['modesSameNotes']) nodesDict['modesSameNotes'] = []
        let note = getSharpValue(Note.transpose(key, interval))
        nodesDict['modesSameNotes'].push({ id:`${mode}-${note}-modesSameNotes`,data:{scale:mode, root:note, intMode}, type: "scaleNode" })
      // if (intMode > intChroma) {
      }
      
    });
  
  nodesDict['modesSameKey'].sort(
    ({ data :{ intMode: intModeA }}, { data : {intMode: intModeB }}) => intModeA - intModeB
  )
  nodesDict['modesSameNotes'].sort(
    ({ data:{intMode: intModeA }}, { data:{intMode: intModeB }}) => intModeA - intModeB
  )
  let originIndexSameKey = indexOfWithOp(nodesDict['modesSameKey'].map(({data:{intMode}})=>intMode), intChroma, "<")
  let originIndexSameNotes = indexOfWithOp(nodesDict['modesSameNotes'].map(({data:{intMode}})=>intMode), intChroma, "<")
  nodesDict['modesSameKey'] = nodesDict['modesSameKey'].map((n:any, i)=>{
    return {
    ...n,
    data: {
      ...n.data,
      row: i>=originIndexSameKey?i-originIndexSameNotes+1:i-originIndexSameNotes,
      col:0,

    }
  }
  })
  nodesDict['modesSameNotes'] = nodesDict['modesSameNotes'].map((n:any, i)=>({
    ...n,
    data: {
      ...n.data,
      row: i>=originIndexSameKey?i-originIndexSameNotes+1:i-originIndexSameNotes,
      col: 1
    }
    // position:{
    //   x: originNode.position.x*3,
    //   y: originNode.position.y + nodeHeight * 1.2 * (i + 1)
    // }
  }))
  nodesDict['circleOfFifths'] = []
  for (let i of [1,2,3,4,5,6]){
    let note = getSharpValue(Note.transposeBy(Interval.fromSemitones(-5*i))(key))
    nodesDict['circleOfFifths'].push({ id: `${scale}-${note}-circleOfFifths`, data:{scale, root:note, intChroma, row:(i), col:-1},  type: "scaleNode" })
    if (i!==6){
      let note2 = getSharpValue(Note.transposeBy(Interval.fromSemitones(5*i))(key))
      nodesDict['circleOfFifths'].push({ id: `${scale}-${note2}-circleOfFifths`, data:{scale, root:note2, intChroma, row:-(i), col:-1},  type: "scaleNode" })
    }
  }
  
  let newNodes = Object.values(nodesDict).flat().map((n:any)=>{
    let {data:{row,col,root,scale }} = n
    n.position={
      y: row*nodeHeight*1.2,
      x: col*nodeWidth*1.2
    }
    return n
  });
  
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