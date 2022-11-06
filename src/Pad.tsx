import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import './App.css';
import { Layer, Stage, Text, Rect, Group, Line } from 'react-konva';
import { Midi, Scale, Note, Interval } from "@tonaljs/tonal";
import { LineConfig } from 'konva/lib/shapes/Line';
import { TextConfig } from 'konva/lib/shapes/Text';
import { RectConfig } from 'konva/lib/shapes/Rect';
import {el} from '@elemaudio/core';
import { ElementaryAudioContext } from '.';
import { FlowSelectorContext } from './FlowSelector';
const minNote = 60
const maxNote = 84
const getSharpValue = (noteLabel)=>{
  let simplified = Note.simplify(noteLabel)
  if (simplified.includes('b')){
    return `${Note.transposeBy(Interval.fromSemitones(-1))(simplified)}#`
  }
  return simplified
}
const range = (min: number, max: number)=>{
  return (new Array(max-min)).fill(1).map((i,j)=>j+min)
}
const prova = range(minNote, maxNote)
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
// const getDir = ({x,y}, buffer=0.3)=>{
//   let mod = Math.sqrt(Math.pow(x,2)+Math.pow(y,2))
//   x = x/mod
//   y = y/mod
//   // let [xAprox, yAprox] =[Math.round(x*2)/2, Math.round(y*2)/2]
//   let orientation = ''
//   if (Math.abs(y)>=buffer){
//     orientation = y>0?'N':'S'
//   }
//   if (Math.abs(x)>=buffer){
//     orientation += x>0?'E':'O'
//   }
//   console.log(orientation, x,y)
//   // let returnVal = Object.entries(DIRECTIONS).find(([k,{x,y}])=>x===xAprox&&y===yAprox)
//   if (orientation) return orientation
//   // console.log(x,y, xAprox, yAprox)
//   return null
// }
const multiply = (dir, num)=>({...dir,x:dir.x*num, y:dir.y*num})
const add = (dir, dir2)=>({...dir,x:dir.x+dir2.x, y:dir.y+dir2.y})
const synthFunc = (props: {freq: number, key: string})=>{
  return el.mul(el.cycle(el.const({value: props.freq, key:props.key})), 0.2)
}

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


const getId = (cell)=>`(x:${cell.x},y:${cell.y})`
function generateGrid(): {grid:Record<string,{x:number,y:number,note:number}>, minX:number, maxX:number,minY:number,maxY:number} {
  let minNote = Math.min(...prova)
  let root = {x:0, y:0}
  let result = prova.reduce((acc,note)=>{

    let cells = getCells(note, minNote, root).map(r=>({...r,note}))
    // let cell2 = getCell(note, minNote, root, 1)
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

function Pad({width, height}) {
  const {grid, minX, maxX, minY, maxY} = useMemo(()=>{
    return generateGrid()
  },[])
  const [cells, ] = React.useState(grid);
  
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
    let offset = cellD/2//cellLat*(1-Math.cos(Math.PI/4))
    return {squareSize: cellLat, offset, extraX, extraY}
    // return {widthCell: cellLat,heightCell: cellLat}
  }, [height, maxX, maxY, minX, minY, width])
  const [started, setStarted] = useState(false)
  // const ScaleInput = useMemo(()=>(),[])
  const [activeVoices, setActiveVoices] = useState<Record<string,string|null>>({})
  const startCell = useCallback((touchId, cellId)=>{
    try{
      console.log('start',touchId, cellId)
      setActiveVoices((activeV)=>{
        if (!activeV[touchId]||activeV[touchId]!==cellId){
          return {...activeV, [touchId]: cellId}
        }
        return activeV
      })
    }catch(ex){
      console.warn('ERROR',ex)
    }
  },[setActiveVoices])
  const stopCell = useCallback((touchId, cellId?)=>{
    try{
    console.log('stop', touchId, cellId)
    setActiveVoices((activeV)=>{
      if (activeV[touchId]){
        let newActiveV = {...activeV, [touchId]: null}
        return newActiveV
      }
      return activeV
    })}catch(ex){
      console.warn('ERROR',ex)
    }
  },[setActiveVoices])
  const {core} = useContext(ElementaryAudioContext)
  const play = useCallback((notesFreq: {freq: number|null,key:string}[])=>{
    if (!notesFreq) notesFreq = []
    if (!Array.isArray(notesFreq)) notesFreq = [notesFreq]
    if (notesFreq.length>0){
      let toRender = notesFreq.map((n)=>n.freq?synthFunc(n as {freq:number,key:string}): el.constant({value:0})) 
      let out = el.add(...toRender)
      core.render(out, out)
    }
  },[core])
  useEffect(()=>{
    let voices = Object.entries(activeVoices).map((([touchId,cellId]: any)=>{
      // return values.map((v,i)=>{
        return {freq:cellId?Midi.midiToFreq(Midi.toMidi(cells[cellId].note)!):null, key:`${touchId}`}
      // })
    })).flat()
    // console.log('rendering', voices)
    play(voices)
  },[activeVoices, cells, play])
  const activeCells = useMemo(()=>Object.fromEntries(Object.entries(activeVoices).map(([k,v])=>([v,k]))),[activeVoices])
  // console.log(activeCells)
  // const [selectedScale, setScale ] = useState<string|null>(null)
  // const [selectedRoot, setKey] = useState<string|null>(null)
  const {scale: selectedScale, key: selectedRoot, setKey} = FlowSelectorContext.useFlowSelectorContext()
  const selectedCells = useMemo(()=>{
    if (!selectedRoot || !selectedScale) return []
    let notes = Scale.get(`${selectedRoot} ${selectedScale}`).notes.map(getSharpValue)
    // console.log(notes)
    return notes
  },[selectedRoot, selectedScale])
  const [, setMoves] = useState({})
  const setMove = useCallback((key, point, override=false)=>{
    setMoves((mvs)=>{
      let newVal: any = null
      if (point){
        if (override){
          newVal = [point]
        }else{
          newVal = [point, ...(mvs[key]||[]).slice(0,20)]
        }
      }
      return {...mvs, [key]: newVal}
    })
  },[setMoves])
  // const moveDirections = useMemo(()=>{
  //   return Object.fromEntries(Object.entries(moves)
  //     .filter(([k,v]:any)=>v && v.length>1).map(([k,v]:any)=>{
  //       let xInitial = v[0].x
  //       let yInitial = v[0].y
  //       let {x,y} = v.slice(1).reduce((acc,{x,y})=>({x:acc.x+(x-xInitial), y:acc.y+(y-yInitial)}),{x:0,y:0})
  //       x = x/v.length
  //       y = y/v.length
  //       // console.log(x,y,getDir({x,y}))
  //       return [k,getDir({x,y})]
  //     }))
  // },[moves])
  // console.log(moves)
  return (
    <>
    {/* {JSON.stringify(moveDirections)} */}
    {/* <SelectSimple options={Scale.names()} onChange={(e)=>setScale(e.target.value)}></SelectSimple> */}
    <Stage width={width} height={height} 
      onTouchMove={(e:any)=>{
        if (activeVoices[e.pointerId]) stopCell(e.pointerId)
      }}
      onMouseMove={(e:any)=>{
        if (activeVoices['click']) stopCell('click')
      }}
      onMouseUp={()=>setStarted(false)}
      >
      <Layer >
        {Object.entries(cells).map(([cellId,cell]:any) => {
          let noteLabel = Midi.midiToNoteName(cell.note, { pitchClass: true, sharps: true })
          return (
          //
          <Group x={extraX/2+cell.x*squareSize}  y={extraY/2+((cell.y)*squareSize)} 
            id={`${cell.note}-g`}
            onDblTap={(e)=>setKey(noteLabel)}
            onDblClick={(e)=>setKey(noteLabel)}
            onMouseDown={(e)=>{
              // console.log(Midi.midiToNoteName(cell.note, { pitchClass: true, sharps: true }))
              setStarted(true)
              startCell('click', cellId)
            }}
            onMouseMove={(e)=>{
              e.cancelBubble = true
              if (started){
                setMove('click', {x:e.evt.clientX, y:e.evt.clientY})
                
                // console.log('move',e, )
              }
            }}
            onMouseEnter={()=>{
              if (started){
                setMove('click', null)
                startCell('click', cellId)
              }
            }}
            onMouseUp={(e)=>{
              e.cancelBubble=true
              stopCell('click', cellId)
              setStarted(false)
            }}
            onTouchMove={(e:any)=>{
              e.evt.preventDefault()
              e.cancelBubble=true
              if(activeVoices[e.pointerId]===cellId){
                setMove(e.pointerId, {x:e.evt.clientX, y:e.evt.clientY})
                // console.log('move', e.pointerId, cellId)
              }else{
                setMove(e.pointerId, null)
                startCell(e.pointerId, cellId)
              }
            }}
            onTouchStart={(e:any)=>{
              // console.log(Midi.midiToNoteName(cell.note, { pitchClass: true, sharps: true }))
              startCell(e.pointerId, cellId)
              // startCell(cellId, cell)
            }}
            onTouchEnd={(e:any)=>{
              stopCell(e.pointerId, cellId)
            }}
            > 
            {cell.orientation?
              <TriangleWithLabel 
                offsetTriangle={offset} 
                side={squareSize} 
                orientation={cell.orientation} 
                fill={selectedCells.includes(noteLabel)?"hsl(178, 78%, 40%)":"hsl(77, 78%, 40%)"} 
                strokeWidth={selectedRoot===noteLabel?1.5:0}
                stroke={selectedRoot===noteLabel?'black':undefined}
                opacity={activeCells[cellId]?1:0.7}
                shadowBlur={10}
                shadowOpacity={0.6}
                label={`${cell.note} ${noteLabel}`}/>
              :
              <RectWithLabel
                side={squareSize}
                offsetRect={offset}
                key={cell.note}
                id={`${cell.note}`}
                // fill="#89b717"
                strokeWidth={selectedRoot===noteLabel?1.5:0}
                stroke={selectedRoot===noteLabel?'black':undefined}
                fill={selectedCells.includes(noteLabel)?"hsl(178, 78%, 40%)":"hsl(77, 78%, 40%)"} 
                opacity={activeCells[cellId]?1:0.7}
                // draggable
                
                shadowBlur={10}
                shadowOpacity={0.6}
                // scaleX={cell.isDragging ? 1.2 : 1}
                // scaleY={cell.isDragging ? 1.2 : 1}
                // onDragStart={handleDragStart}
                // onDragEnd={handleDragEnd}
                label={`${cell.note} ${noteLabel}`}
              />}
          {/*  */}
          </Group>
        )})}
      </Layer>
    </Stage></>
  );
}
const RectWithLabel = (props: {side:number,offsetRect:number}&RectConfig&TextProps)=>{
  let {side, label, textProps, offsetRect, ...otherProps} = props
  return <Group>
      <Rect rotation={45} width={side}
            height={side} {...otherProps} x={offsetRect}/>
      <Text {...textProps} x={offsetRect} y={offsetRect} text={label}/>
    </Group>
}

type TriangleProps = {offsetTriangle:number,side:number,orientation:string}&LineConfig
type TextProps = {label:string, textProps?:TextConfig}
const TriangleWithLabel = (props: TriangleProps&TextProps)=>{
  let {label, textProps, ...otherProps} = props
  let {orientation, offsetTriangle} = otherProps
  const textPositionOffset = useMemo(()=>{
    switch(orientation){
      case "S":
        return {x:offsetTriangle, y:(3/2)*offsetTriangle}
      case "N":
        return {x:offsetTriangle, y:(1/2)*offsetTriangle}
      case "E":
        return {x:(3/2)*offsetTriangle, y:offsetTriangle}
      case "O":
        return {x:(1/2)*offsetTriangle, y:offsetTriangle}
    }
  },[orientation, offsetTriangle])
  return <Group>
      <Triangle {...otherProps}/>
      <Text {...textProps} text={label} {...textPositionOffset}/>
    </Group>
}
const Triangle = (props: TriangleProps)=>{
  let {offsetTriangle, side, orientation, ...lineProps} = props
  switch(orientation){
    case "O":
      return <Line closed x={offsetTriangle} points={[0,side,side,side,0,0]} rotation={45} {...lineProps}/>
    case "E":
      return <Line closed x={offsetTriangle} points={[side,0,side,side,0,0]} rotation={45} {...lineProps}/>
    case "N":
      return <Line closed y={offsetTriangle} points={[side,0,side,side,0,0]} rotation={-45} {...lineProps}/>
    case "S":
      return <Line closed y={offsetTriangle}  points={[0,side,side,side,0,0]} rotation={-45} {...lineProps}/>
    default:
      return null
  }
}

export default Pad;
