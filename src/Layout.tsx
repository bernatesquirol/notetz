// import { useMemo } from "react";
// import { Layer, Stage, Text, Rect, Group, Line } from 'react-konva';
// export const DIRECTIONS = {
//   SE: { x: 0.5, y: -0.5 },
//   S: { x: 0, y: -1 },
//   SO: { x: -0.5, y: -0.5 },
//   O: { x: -1, y: 0 },
//   NO: { x: -0.5, y: 0.5 },
//   N: { x: 0, y: 1 },
//   NE: { x: 0.5, y: 0.5 },
//   E: { x: 1, y: 0 },
// };

// const multiply = (dir, num) => ({ ...dir, x: dir.x * num, y: dir.y * num });
// const add = (dir, dir2) => ({ ...dir, x: dir.x + dir2.x, y: dir.y + dir2.y });
// const synthFunc = (props: { freq: number; key: string }) => {
//   return el.mul(el.cycle(el.const({ value: props.freq, key: props.key })), 0.2);
// };

// export const NOTE_DELTA = {
//   0: [],
//   1: ["E"], // C#e
//   2: ["NO", "O"], // D
//   3: ["NO"], // D# Eb
//   4: ["NE"], // E
//   5: ["NO", "O", "NO"], // F
//   6: ["NO", "NO"], // F# Gb
//   7: ["N"], // G
// };
// export const EXTRA_COLUMN = {
//   1: ["NO", "O", "O"],
//   5: ["NE", "E"],
// };
// export const ORIENTATIONS_EXTRA_COLUMN = {
//   1: "E",
//   5: "O",
// };

// export const arrayDirectionsToVector = (arrayDir) => {
//   let current = { x: 0, y: 0 };
//   arrayDir.forEach((k) => {
//     if (typeof k === "string") {
//       current = add(current, DIRECTIONS[k]);
//     } else {
//       let abs = Math.abs(k);
//       let orientation = k / abs;
//       let dir = arrayDirectionsToVector(NOTE_DELTA[abs]);
//       current = add(current, multiply(dir, orientation));
//     }
//   });
//   return current;
// };
// export const directionsNoteDelta = Object.fromEntries(
//   Object.entries(NOTE_DELTA).map(([k, arrayDir]) => {
//     return [k, arrayDirectionsToVector(arrayDir)];
//   })
// );
// export const directionsExtraNotes = Object.fromEntries(
//   Object.entries(EXTRA_COLUMN).map(([k, arrayDir]) => {
//     return [k, arrayDirectionsToVector(arrayDir)];
//   })
// );

// const cicle = arrayDirectionsToVector(["O","O","O","NO"])
// const getCells = (note, numBase, base={x:0,y:0}, offset=0)=>{
//   let delta = note-numBase
//   let numN = Math.floor(delta/7)
//   let dirModule = directionsNoteDelta[delta%7]
//   if (offset){
//     dirModule = add(dirModule, multiply(cicle,offset))
//   }
//   let norths = multiply(DIRECTIONS.N, numN)
//   let finalDir = add(norths, dirModule)
//   let cell = add(base, finalDir)
//   let returnVal = [cell]
//   if (EXTRA_COLUMN[delta%7]){
//     let dirModule2 = directionsExtraNotes[delta%7]
//     let finalDir2 = add(norths, dirModule2)
//     returnVal.push({...add(base, finalDir2), orientation:ORIENTATIONS_EXTRA_COLUMN[delta%7]})
//   }
//   return returnVal
// }


// const getId = (cell)=>`(x:${cell.x},y:${cell.y})`
// export function generateGrid(arrayNotes): {grid:Record<string,{x:number,y:number,note:number}>, minX:number, maxX:number,minY:number,maxY:number} {
//   let minNote = Math.min(...arrayNotes)
//   let root = {x:0, y:0}
//   let result = arrayNotes.reduce((acc,note)=>{

//     let cells = getCells(note, minNote, root).map(r=>({...r,note}))
//     // let cell2 = getCell(note, minNote, root, 1)
//     return [...acc, ...cells]
//   },[] as any[])
//   let xs = result.filter(p=>!p.orientation).map((p:any)=>p.x)
//   let ys = result.filter(p=>!p.orientation).map((p:any)=>p.y)
//   let [maxX, minX] = [Math.max(...xs), Math.min(...xs)]
//   let [maxY, minY] = [Math.max(...ys), Math.min(...ys)]
//   maxY = maxY- minY
//   maxX = maxX- minX
//   let grid = Object.fromEntries(result.map((r:any)=>({...r, x:r.x-minX,y:maxY-(r.y-minY)})).map(r=>([getId(r),multiply(r,Math.SQRT2)])))
//   // debugger
//   return {grid, minX:0, maxX:maxX, minY:0, maxY}
// }
// const TriangleWithLabel = (props: TriangleProps&TextProps)=>{
//     let {label, textProps, ...otherProps} = props
//     let {orientation, offsetTriangle} = otherProps
//     const textPositionOffset = useMemo(()=>{
//       switch(orientation){
//         case "S":
//           return {x:offsetTriangle, y:(3/2)*offsetTriangle}
//         case "N":
//           return {x:offsetTriangle, y:(1/2)*offsetTriangle}
//         case "E":
//           return {x:(3/2)*offsetTriangle, y:offsetTriangle}
//         case "O":
//           return {x:(1/2)*offsetTriangle, y:offsetTriangle}
//       }
//     },[orientation, offsetTriangle])
//     return <Group>
//         <Triangle {...otherProps}/>
//         <Text {...textProps} text={label} {...textPositionOffset}/>
//       </Group>
//   }
//   const Triangle = (props: TriangleProps)=>{
//     let {offsetTriangle, side, orientation, ...lineProps} = props
//     switch(orientation){
//       case "O":
//         return <Line closed x={offsetTriangle} points={[0,side,side,side,0,0]} rotation={45} {...lineProps}/>
//       case "E":
//         return <Line closed x={offsetTriangle} points={[side,0,side,side,0,0]} rotation={45} {...lineProps}/>
//       case "N":
//         return <Line closed y={offsetTriangle} points={[side,0,side,side,0,0]} rotation={-45} {...lineProps}/>
//       case "S":
//         return <Line closed y={offsetTriangle}  points={[0,side,side,side,0,0]} rotation={-45} {...lineProps}/>
//       default:
//         return null
//     }
//   }
// const Layout = ({notes, onEnter, onStop}) => {
//     const {grid, minX, maxX, minY, maxY} = useMemo(()=>{
//         return generateGrid(notes)
//     },[])
//     const [cells, ] = React.useState(grid);
  
//   const {squareSize, offset, extraX, extraY} = useMemo(()=>{
//     let [numW,numH] = ([(1+maxX-minX),1+maxY-minY])
//     console.log(width/numW, numW, height/numH, numH)
//     let cellD = Math.min(width/numW, height/numH)
//     let extraX = 0
//     let extraY = 0
//     if (cellD*numW < width){
//       extraX = width-cellD*numW
//     }
//     if (cellD*numH < height){
//       extraY = height-cellD*numH
//     }
//     let cellLat = cellD/Math.SQRT2
//     let offset = cellD/2//cellLat*(1-Math.cos(Math.PI/4))
//     return {squareSize: cellLat, offset, extraX, extraY}
//     // return {widthCell: cellLat,heightCell: cellLat}
//   }, [height, maxX, maxY, minX, minY, width])
  
// };
const Layout = ()=>{}
export default Layout;
