import { useCallback, useContext, useEffect, useState } from 'react';
import { useWindowSize } from 'react-use-size';
import { ElementaryAudioContext } from '.';
// import { read } from "midifile-ts"
import { PlayingPad } from './Pad';
import FlowSelector, { FlowSelectorContext } from './FlowSelector';
// import { createDefinitiveMap, createMapChords, createMapScales } from './utilsTonal';
import React from 'react';
import {el} from '@elemaudio/core';
import _ from 'lodash';
import { createDefinitiveMap } from './utilsTonal';
export const ElementaryContext = React.createContext({voices: {} as Record<string,Voice[]>, toggleVoice:(k,v)=>{}})
const synthFunc = (props: {freq: number, key: string})=>{
  return el.mul(el.cycle(el.const({value: props.freq, key:props.key})), 0.2)
}
export type Voice = {freq: number, cellId: string}
export const ElementaryContextProvider = ({children})=>{
  const [voices, setVoices] = useState<Record<string,Voice[]>>({})
  const toggleVoice = useCallback((key, voice: null|Voice[]|((voices:Voice[])=>void))=>{
    setVoices((prevVoices)=>{
      let {[key]: state, ...avs} = prevVoices
      let value: any = null
      if (typeof voice === 'function'){
        let freqFunc = voice as (freqNotes:Voice[])=>void
        value = freqFunc(state)
      }else{
        value = voice
      }
      if (!_.isEqual(state, voice)){
        return {...avs, [key]:value}
      }
      return prevVoices
    })
  },[setVoices])
  const {core} = useContext(ElementaryAudioContext)
  const play = useCallback((notesFreq: ({key:string, voices: Voice[]})[])=>{
    
    if (!notesFreq) notesFreq = []
    if (notesFreq.length>0){
      let toRender = notesFreq.map((n)=>n.voices?n.voices.map((v,i)=>synthFunc({freq: v.freq, key:`${n.key}-${v.cellId}`} as {freq:number,key:string})): el.constant({value:0})).flat() 
      let out = el.add(...toRender)
      console.log('rendering', notesFreq)
      core.render(out, out)
    }
  },[core])
  useEffect(()=>{
    let voicesMapped = Object.entries(voices).map((([touchId,noteFreq])=>{
      // return values.map((v,i)=>{
        return {voices:noteFreq, key:`${touchId}`}
      // })
    }))
    console.log('render', voices)
    play(voicesMapped)
  },[voices, play])

  return <ElementaryContext.Provider value={{voices, toggleVoice}}>
    {children}
  </ElementaryContext.Provider>
}
export const defaultOctave = 4
const minNote = 60
const maxNote = 84

const range = (min: number, max: number)=>{
  return (new Array(max-min)).fill(1).map((i,j)=>j+min)
}
const prova = range(minNote, maxNote)
function Intro() {
  const eContext = useContext(ElementaryAudioContext)
  const [ready, setReady] = useState(eContext.audioContext.state!=='suspended')
  const resumeAudio = (e)=>{
    if (eContext.audioContext.state === 'suspended') {
      eContext.audioContext.resume().then(a=>{
        setReady(true)
      }).catch((e)=>{
        console.log('sth wrong', e)
      })
    }
    setReady(true)
  }
  // const windowSize = useWindowSize()
  // const vertical = useMemo(()=>{
  //   return false // windowSize.width>windowSize.height
  // },[])
  const {width, height} = useWindowSize()
  return (
    <>
    {ready?
    <ElementaryContextProvider>
    <FlowSelectorContext.Provider initialValue={{key:'D', scale:'dorian', defaultOctave:4}}>
      {/* <FlowSelector width={width} height={height*0.25} createNodesAndEdges={createMapScales} /> */}
      <FlowSelector width={width} height={height*0.5} createNodesAndEdges={createDefinitiveMap} />
      <PlayingPad width={width} height={height*0.5} notes={prova}/>
    </FlowSelectorContext.Provider>
    </ElementaryContextProvider>
    :<button style={{width:'100%', height:window.innerHeight}} onClick={resumeAudio}>Play!</button>}
    </>
  );
}

export default Intro;


