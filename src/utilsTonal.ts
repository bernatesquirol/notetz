import { Interval, Midi, Note, Scale } from "@tonaljs/tonal";
import { defaultOctave } from "./Intro";
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
export function getChord(base, scale, sequentialChroma, baseOctave=defaultOctave){
  let baseSharp = getSharpValue(base)
  let notes = scale.notes.map(n=>getSharpValue(n))
  let index = notes.indexOf(baseSharp)
  let chromaLocal = [...notes.slice(index).map(n=>[n,0]), ...notes.slice(0,index).map(n=>[n,1])]
  let notesObjs = [...sequentialChroma].map((d, i)=>d==='1'?chromaLocal[i]:null).filter(d=>d).map(([n, extraOctave])=>{
    return Note.get(`${n}${baseOctave+extraOctave}`)
  })
  return notesObjs

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
export const toFreq = (note)=>{
  return Midi.midiToFreq(Midi.toMidi(note)!)
}
export const toMidi = (noteLabel)=>{
  return Note.get(noteLabel).midi
}
export const createDefinitiveMap = (scale, key, nodeWidth, nodeHeight)=>{
  let originNode = ({ id: scale, data: { scale, root: key, selected: true }, position:{x:0, y: 0}, type: "scaleNode" });
  let modeChroma = Scale.get(scale).chroma;
  let intChroma = parseInt(modeChroma, 2);
  let nodesDict = {}
  // let thirdFactory = getChordFactory('111')
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
    let {data:{row,col }} = n
    n.position={
      y: row*nodeHeight*1.1,
      x: col*nodeWidth*1.2
    }
    return n
  });
  
  let nodes = [originNode, ...newNodes];//]//
  return {nodes}
}
