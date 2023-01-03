import React, { memo, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './App.css';
import { Layer, Stage, Text, Group, Line } from 'react-konva';
import { Midi, Scale } from "@tonaljs/tonal";
import { TextConfig } from 'konva/lib/shapes/Text';
import { RectConfig } from 'konva/lib/shapes/Rect';
import { FlowSelectorContext } from './FlowSelector';
import { getSharpValue, toFreq } from './utilsTonal';
import { ElementaryContext, Voice } from './Intro';


export const DIRECTIONS = {
  SE: {x:0.5,y:-0.5},
  S: {x:0,y:-1},
  SO:{x:-0.5,y:-0.5},
  O:{x:-1,y:0},
  NO: {x:-0.5, y:0.5},
  N: {x:0, y:1},
  NE: {x:0.5,y:0.5},
  E: {x:1,y:0}
};

const multiply = (dir, num)=>({...dir,x:dir.x*num, y:dir.y*num})
const add = (dir, dir2)=>({...dir,x:dir.x+dir2.x, y:dir.y+dir2.y})


export const NOTE_DELTA = {
  0: [],
  1: ["E"], // C#e
  2: ["NO", "O"], // D
  3: ["NO"], // D# Eb
  4: ["NE"], // E
  5: ["NO", "O", "NO"], // F
  6: ["NO", "NO"], // F# Gb
  7: ["N"], // G
};
export const EXTRA_COLUMN = {
  1: ["NO", "O", "O"],
  5: ["NE", "E"]
}
export const ORIENTATIONS_EXTRA_COLUMN = {
  1: "E",
  5: "O"
}
export const arrayDirectionsToVector = (arrayDir) => {
  let current = {x:0,y:0};
  arrayDir.forEach((k) => {
    if (typeof k === "string") {
      current = add(current, DIRECTIONS[k]);
    } else {
      let abs = Math.abs(k);
      let orientation = k / abs;
      let dir = arrayDirectionsToVector(NOTE_DELTA[abs]);
      current = add(current, multiply(dir, orientation));
    }
  });
  return current;
};
export const directionsNoteDelta = Object.fromEntries(
  Object.entries(NOTE_DELTA).map(([k, arrayDir]) => {
    return [k, arrayDirectionsToVector(arrayDir)];
  })
);
export const directionsExtraNotes =  Object.fromEntries(
  Object.entries(EXTRA_COLUMN).map(([k, arrayDir]) => {
    return [k, arrayDirectionsToVector(arrayDir)];
  })
);
const cicle = arrayDirectionsToVector(["O","O","O","NO"])
const getCells = (note, numBase, base={x:0,y:0}, offset=0)=>{
  let delta = note-numBase
  let numN = Math.floor(delta/7)
  let dirModule = directionsNoteDelta[delta%7]
  if (offset){
    dirModule = add(dirModule, multiply(cicle,offset))
  }
  
  let norths = multiply(DIRECTIONS.N, numN)
  let finalDir = add(norths, dirModule)
  let cell = add(base, finalDir)
  let returnVal = [cell]
  if (EXTRA_COLUMN[delta%7]){
    let dirModule2 = directionsExtraNotes[delta%7]
    let finalDir2 = add(norths, dirModule2)
    returnVal.push({...add(base, finalDir2), orientation:ORIENTATIONS_EXTRA_COLUMN[delta%7]})
  }
  return returnVal
}

// type Cell = {note: number}
const getId = (cell)=>`(x:${cell.x},y:${cell.y})`
function generateGrid(listNotes): {grid:Record<string,{x:number,y:number,note:number}>, minX:number, maxX:number,minY:number,maxY:number} {
  let minNote = Math.min(...listNotes)
  let root = {x:0, y:0}
  let result = listNotes.reduce((acc,note)=>{
    let cells = getCells(note, minNote, root).map(r=>({...r, note, label:Midi.midiToNoteName(note, { pitchClass: true, sharps: true })}))
    return [...acc, ...cells]
  },[] as any[])
  let xs = result.filter(p=>!p.orientation).map((p:any)=>p.x)
  let ys = result.filter(p=>!p.orientation).map((p:any)=>p.y)
  let [maxX, minX] = [Math.max(...xs), Math.min(...xs)]
  let [maxY, minY] = [Math.max(...ys), Math.min(...ys)]
  maxY = maxY- minY
  maxX = maxX- minX
  let grid = Object.fromEntries(result.map((r:any)=>({...r, x:r.x-minX,y:maxY-(r.y-minY)})).map(r=>([getId(r),multiply(r,Math.SQRT2)])))
  // debugger
  return {grid, minX:0, maxX:maxX, minY:0, maxY}
}
export function PlayingPad({width, height, notes}){
  const {toggleVoice, voices} = useContext(ElementaryContext)
  const startCell = useCallback((touchId, cell)=>{
    try{
      if (touchId == null) throw Error('start: more than 8')
      toggleVoice(touchId, [{id:cell.note, freq:toFreq(cell.note)}])
    }catch(ex){
      console.warn('ERROR',ex)
    }
  },[toggleVoice])
  const stopCell = useCallback((touchId)=>{
    try{
      if (touchId == null) throw Error('stop: more than 8')
      toggleVoice(touchId, null)
    }catch(ex){
      console.warn('ERROR',ex)
    }
  },[toggleVoice])
  //const {setKey} = FlowSelectorContext.useFlowSelectorContext()
  const onDblHitCell = useCallback((cell)=>{/*setKey(cell.label)*/},[/*setKey*/])
  const activeCells = useMemo(()=>{
    let active = Object.fromEntries(Object.entries(voices||{}).map(([k,v])=>(v?.map(voice=>([voice.id, k])))).flat().filter(d=>d))
    return active
  },
  [voices])
  return <Pad {...{width, height, notes, voices, startCell, stopCell, onDblHitCell, activeCells}} style={{
    shadowBlur:10,
    shadowOpacity: 0.6
  }} ></Pad>
}
type ColouredPadParams = {selectedRoot:string, selectedScale:string}&PadParams
type PadParams = {width:number, height: number, notes:number[], voices?:Record<string,Voice[]>, stopCell?: (id:string)=>void, startCell?: (id:string, cell: any)=>void, onDblHitCell?: (cell:any)=>void, style?: object, activeCells?:Record<number|string, string>}

export const ColouredPad = memo(({selectedRoot, selectedScale, width, height, notes, voices, stopCell, startCell, onDblHitCell, style, activeCells}:ColouredPadParams) => {

  const {grid:cells, minX, maxX, minY, maxY} = useMemo(()=>{
    return generateGrid(notes)
  },[notes])
  const {squareSize, offset, extraX, extraY} = useMemo(()=>{
    let [numW,numH] = ([(1+maxX-minX),1+maxY-minY])
    // console.log(width/numW, numW, height/numH, numH)
    let cellD = Math.min(width/numW, height/numH)
    let extraX = 0
    let extraY = 0
    if (cellD*numW < width){
      extraX = width-cellD*numW
    }
    if (cellD*numH < height){
      extraY = height-cellD*numH
    }
    let cellLat = cellD/Math.SQRT2
    let offset = cellD/2
    return {squareSize: cellLat, offset, extraX, extraY}    
  }, [height, maxX, maxY, minX, minY, width])
  const [started, setStarted] = useState(false)
  // const ScaleInput = useMemo(()=>(),[])
  const selectedCells = useMemo(()=>{
    if (!selectedRoot || !selectedScale) return []
    let notes = Scale.get(`${selectedRoot} ${selectedScale}`).notes.map(getSharpValue)
    return notes
  },[selectedRoot, selectedScale])
  const refTouches = useRef<object>()

  const getTouchKey = useCallback((touchId)=>{
    if (!refTouches.current) refTouches.current = {}
    if (refTouches.current[touchId]!=null){
      return refTouches.current[touchId]
    }else{
      let range08 = [0,1,2,3,4,5,6,7,8]
      // Object.keys(refTouches)
      let newId = range08.find(id=>!voices || !voices[id])
      refTouches.current[touchId]=newId
    }
    return refTouches.current[touchId]
  },[voices])
  return (
    <>
    {/* {JSON.stringify(moveDirections)} */}
    {/* <SelectSimple options={Scale.names()} onChange={(e)=>setScale(e.target.value)}></SelectSimple> */}
    <Stage width={width} height={height} 
      // onTouchMove={(e:any)=>{
      //   if (voices[getTouchKey(e.pointerId)]) stopCell(getTouchKey(e.pointerId))
      // }}
      onMouseMove={(e:any)=>{
        // if (voices['click']) stopCell('click')
      }}
      onMouseUp={(e)=>{
        if (voices && stopCell && voices['click']) stopCell('click')
        setStarted(false)
      }}
      onTouchEnd={(e: any)=>{
        if (voices && stopCell && voices[getTouchKey(e.pointerId)]) stopCell(getTouchKey(e.pointerId))
      }}
      // onTouchMove={(e:any)=>{
      //   console.log(e)
      // }}
      >
      <Layer >
        {Object.entries(cells).map(([cellId,cell]:any) => {
          let noteLabel = cell.label
          let effects = selectedCells.includes(noteLabel)? {
            onMouseDown:(e)=>{
              // console.log(e)
              setStarted(true)
              if (startCell)startCell('click', cell)
            },
            onMouseUp:(e)=>{
              if (stopCell){
                e.cancelBubble=true
                stopCell('click')
                setStarted(false)
              }
            },
            onTouchStart:(e:any)=>{
              if(startCell){
                startCell(getTouchKey(e.pointerId), cell)
              }
            },
            onTouchEnd: (e:any)=>{
              if (stopCell){
                stopCell(getTouchKey(e.pointerId))
              }
            },
            
          }:{};
          let effectsMove = selectedCells.includes(noteLabel)? {
            onMouseMove:(e)=>{
              e.cancelBubble = true
              if (started){
                // setMove('click', {x:e.evt.clientX, y:e.evt.clientY})
                
                // console.log('move',e, )
              }
            },
            onTouchMove:(e:any)=>{
              // e.evt.preventDefault()
              // e.cancelBubble=true
              if(voices && voices[getTouchKey(e.pointerId)]===cellId){
                // setMove(getTouchKey(e.pointerId), {x:e.evt.clientX, y:e.evt.clientY})
                // console.log('move', getTouchKey(e.pointerId), cellId)
              }else{
                // setMove(getTouchKey(e.pointerId), null)
                if (startCell) startCell(getTouchKey(e.pointerId), cell)
              }
            },
            onMouseEnter:()=>{
              if (started){
                // setMove('click', null)
                if (startCell) startCell('click', cell)
              }
            },
          }:{}
          return (
          //
          <Group x={extraX/2+cell.x*squareSize}  y={extraY/2+((cell.y)*squareSize)} 
            id={`${cell.note}-g`}
            onDblTap={onDblHitCell?((e)=>onDblHitCell(cell)):undefined}
            onDblClick={onDblHitCell?((e)=>onDblHitCell(cell)):undefined}
            >
              <RectWithLabel
                orientation={cell.orientation}
                side={squareSize}
                offsetRect={offset}
                key={cell.note}
                id={`${cell.note}`}
                // fill="#89b717"
                strokeWidth={selectedRoot===noteLabel?1.5:0}
                stroke={selectedRoot===noteLabel?'black':undefined}
                fill={selectedCells.includes(noteLabel)?"hsl(178, 78%, 40%)":"hsl(77, 78%, 40%)"} 
                opacity={activeCells && activeCells[cell.note]?1:0.7}
                // draggable
                
                // scaleX={cell.isDragging ? 1.2 : 1}
                // scaleY={cell.isDragging ? 1.2 : 1}
                // onDragStart={handleDragStart}
                // onDragEnd={handleDragEnd}
                label={`${noteLabel}`}
                effects={effects}
                effectsMove={effectsMove}
                {...(style||{})}
              />
          </Group>
        )})}
      </Layer>
    </Stage></>
  );
})
export const Pad = (params:PadParams)=>{
  const {scale, key} = FlowSelectorContext.useFlowSelectorContext()
  return <ColouredPad {...params} selectedScale={scale} selectedRoot={key}/>
}
const RectWithLabel = (props: {orientation?:keyof typeof DIRECTIONS,side:number,offsetRect:number}&RectConfig&TextProps)=>{
  let {side, effects, effectsMove,orientation, label, textProps, offsetRect, ...otherProps} = props
  const textPositionOffset = useMemo(()=>{
    switch(orientation){
      case "S":
        return {x:offsetRect, y:(3/2)*offsetRect}
      case "N":
        return {x:offsetRect, y:(1/2)*offsetRect}
      case "E":
        return {x:offsetRect, y:offsetRect}
      case "O":
        return {x:(1/2)*offsetRect, y:offsetRect}
      default: 
        return {x: offsetRect, y:offsetRect}
    }
  },[orientation, offsetRect])
  const {fontSize, textXOffset} = useMemo(()=>({fontSize:side/4,textXOffset:["E", "O"].includes(orientation||'')?(0):(side/16)}),[side,orientation])
  return <Group {...effects}>
      <RectBuffer buffer={0} rotation={45} side={side}
            orientation={props.orientation} 
            {...otherProps} x={offsetRect} />
      <RectBuffer buffer={0.25} rotation={45} side={side} {...otherProps} x={offsetRect} orientation={orientation}  {...effectsMove} opacity={0} strokeWidth={0}/>
      <Text align="center" {...textProps} fontSize={fontSize} x={textPositionOffset.x-textXOffset} y={textPositionOffset.y-textXOffset} text={label}/>
    </Group>
}

const RectBuffer = ({side, buffer, orientation, ...props})=>{
  let x0 = (t)=>0+side*t
  let y0 = (t)=>side
  let x1 = (t)=>side
  let y1 = (t)=>side-side*t
  let x2 = (t)=>side-side*t
  let y2 = (t)=>0
  let x3 = (t)=>0
  let y3 = (t)=>side*t  
  // let points = [x0(0), y0(0), x1(0), y1(0), x2(0), y2(0), x3(0), y3(0),]
  // if (!excludedOrientations) excludedOrientations = []
  let points:any[] = [] // [x0(1), y0(1), x1(1), y1(1), x2(1), y2(1), x3(1), y3(1),]
  // if (excludedOrientations){}
  // let bufferO, bufferE, bufferN, bufferS
  
  let bufferO = orientation==='E'?0:buffer
  let bufferE = orientation==='O'?0:buffer
  if (orientation!=="E") points.push([x3(1-buffer), y3(1-buffer), x0(buffer), y0(buffer), ])
  if (orientation!=="N") points.push([x0(1-bufferO), y0(1-buffer), x1(buffer), y1(bufferE),])
  if (orientation!=="O") points.push([x1(1-buffer), y1(1-buffer), x2(buffer), y2(buffer), ])
  if (orientation!=="S") points.push([x2(1-bufferE), y2(1-buffer), x3(buffer), y3(bufferO), ])
  // [0,side,side,side,side,0,0,0]
  return <Line closed points={points.flat()} rotation={45} {...props}/>
}
// type TriangleProps = {offsetRect:number,side:number,orientation:string}&LineConfig
type TextProps = {label:string, textProps?:TextConfig}
// const TriangleWithLabel = (props: TriangleProps&TextProps)=>{
//   let {label, textProps, ...otherProps} = props
//   let {orientation, offsetRect} = otherProps
//   const textPositionOffset = useMemo(()=>{
//     switch(orientation){
//       case "S":
//         return {x:offsetRect, y:(3/2)*offsetRect}
//       case "N":
//         return {x:offsetRect, y:(1/2)*offsetRect}
//       case "E":
//         return {x:offsetRect, y:offsetRect}
//       case "O":
//         return {x:(1/2)*offsetRect, y:offsetRect}
//     }
//   },[orientation, offsetRect])
//   return <Group>
//       <RectBuffer buffer={0.25} {...otherProps}/>
//       <Text {...textProps} text={label} {...textPositionOffset}/>
//     </Group>
// }
// const Triangle = (props: TriangleProps)=>{
//   let {offsetRect, side, buffer, orientation, ...lineProps} = props
//   switch(orientation){
//     case "O":
//       return <Line closed x={offsetRect} points={[0,side,side,side,0,0]} rotation={45} {...lineProps}/>
//     case "E":
//       return <Line closed x={offsetRect} points={[side,0,side,side,0,0]} rotation={45} {...lineProps}/>
//     case "N":
//       return <Line closed y={offsetRect} points={[side,0,side,side,0,0]} rotation={-45} {...lineProps}/>
//     case "S":
//       return <Line closed y={offsetRect}  points={[0,side,side,side,0,0]} rotation={-45} {...lineProps}/>
//     default:
//       return null
//   }
// }


