import ReactFlow, { Controls, Background, NodeTypes, ReactFlowProvider } from "reactflow";


import "reactflow/dist/style.css";
import { memo, useCallback, useContext, useMemo } from "react";
import { Chord, Interval, Scale } from "@tonaljs/tonal";
// import { Scale:ScaleType } from "@tonaljs/tonal/dist/index/Scale";
import { autoContextProviderFactory } from "./utils";
import { getChord, toFreq } from "./utilsTonal";
import { Pad } from "./Pad";
import { ElementaryContext,} from "./Intro";
const nodeWidth = 172;
const nodeHeight = 45;
const styleNodes: any = {
  float: "left",
  border: "1px solid black",
  borderRadius: 5,
  width: nodeWidth,
  height: nodeHeight,
  textAlign: "center",
};
const intervalToRoman = {"1":'i', "2":'ii', "3":'iii', "4":'iv', "5":'v', "6":'vi', "7":'vii'}
export const getRomanChordLabel = (chordObj, scale)=>{
  let interval = Interval.distance(chordObj.notes[0], scale.notes[0])[0]
  let romanNum = intervalToRoman[interval]; // => "bIII"
  if (!romanNum) console.log(chordObj, interval)
  if (chordObj.quality==='Major') romanNum = romanNum.toUpperCase()
  return romanNum
}
// import levenshtein from 'fast-levenshtein'

const ChordPanel = memo(({root, scale, width, height, toggleVoice}: {root:string, scale:any, width:number, height:number, toggleVoice:(k:string, voices: any)=>void})=>{
  // const rootMidi = useMemo(()=>minNote+(Note.get(root)?.chroma||0),[root])
  // real obj
  let chordNotesObjs = useMemo(()=>getChord(root, scale, '10101'),[root, scale])
  
  // let {defaultOctave}: any = useContext(FlowSelectorContext)
  let chordNotes = useMemo(()=>chordNotesObjs.map(n=>n.name),[chordNotesObjs])
  let chordObj = useMemo(()=>{
    let chordSel = Chord.detect(chordNotes)
    if (!chordSel) return null
    return Chord.get(chordSel[0])
  },[chordNotes])
  let chordNotesMidi = useMemo(()=>chordNotesObjs.map(n=>n.midi) as number[],[chordNotesObjs])
  // console.log('rendering chord!', chordNotesMidi)
  return <div style={{fontSize:'xx-small', width, height}} onClick={()=>toggleVoice('chord', chordNotesMidi.map(note=>({id:note, freq: toFreq(note)})))}>
    <Pad width={width} height={height} notes={chordNotesMidi}/>
    {chordObj?chordObj.symbol:chordNotes.join(";")}
  </div>
})
//
const ScaleNode = memo(({ id, data, targetPosition, sourcePosition }: any) => {
  let {scale, root} = data
  const scaleObj = useMemo(()=>Scale.get(`${root} ${scale}`),[root,scale])
  const {toggleVoice} = useContext(ElementaryContext)
  return (
    
     <div
        style={styleNodes}
        
      >
        <div style={{fontSize: 'xx-small'}} onClick={() => data?.setContext({ key: data.root, scale: data.scale })}>
        {root ? `${root} ` : ""}
        {scale}
        </div>
        <div style={{display:'flex'}}>
          {scaleObj.notes.map(n=><div style={{flex:1}}><ChordPanel toggleVoice={toggleVoice} root={n} scale={scaleObj} width={nodeWidth/7} height={nodeHeight/2}/></div>)}
        </div>
      </div>
    
  );
});
// const ModeNode = memo(({ id, data, targetPosition, sourcePosition }: any) => {
//   return (
//     <>
//       {/* <Handle type="target" position={targetPosition} /> */}
//       <div
//         style={{ ...styleNodes, width: nodeWidth / 2 }}
//         onClick={() => data?.setContext({ key: data.root, scale: data.scale })}
//       >
//         {data.root ? `${data.root} ` : ""}
//         {data.scale}
//       </div>
//       <div
//         style={{ ...styleNodes, width: nodeWidth / 2 }}
//         onClick={() =>
//           data?.setContext({
//             key: Note.transpose(data.root, data.interval),
//             scale: data.scale,
//           })
//         }
//       >
//         {data.root ? `${Note.transpose(data.root, data.interval)} ` : ""}
//         {data.scale}
//       </div>
//       {/* <Handle type="source" position={sourcePosition} /> */}
//     </>
//   );
// });
// const ChordNode = memo(({ id, data, targetPosition, sourcePosition }: any) => {
//   return (
//     <>
//       <Handle type="target" position={targetPosition} />
//       <div style={{ ...styleNodes }}>{data.key}{data.chord} ({data.notes.join(",")})</div>
//       {/* <Handle type="source" position={sourcePosition} /> */}
//     </>
//   );
// });
const nodeTypes: NodeTypes = {
  // modeNode: ModeNode,
  scaleNode: ScaleNode,
  // chordNode: ChordNode,
};




export const FlowSelectorContext = autoContextProviderFactory<{
  mode?: string;
  key?: string;
  defaultOctave?: number
}>({ mode: undefined, key: undefined, defaultOctave: undefined }, "FlowSelector");

const FlowSelector = ({ width, height, createNodesAndEdges }) => {
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
    let {nodes, edges} = createNodesAndEdges(scale, key, nodeWidth, nodeHeight)
    return { nodes: nodes.map(createNode), edges };
  }, [scale, key, createNode, createNodesAndEdges]);
  // const reactFlowInstance = useReactFlow();
  // useEffect(() => {
  //   reactFlowInstance.setCenter(0,0)
  //   console.log(reactFlowInstance);
  // }, []);
  return (
    <div style={{ height, width }}>
      <ReactFlow
       fitView={true}
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
