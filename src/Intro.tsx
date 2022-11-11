import { useCallback, useContext, useEffect, useState } from 'react';
import { useWindowSize } from 'react-use-size';
import { ElementaryAudioContext } from '.';
// import { read } from "midifile-ts"
import Pad from './Pad';
import { FlowSelectorContext } from './FlowSelector';
// import { createDefinitiveMap, createMapChords, createMapScales } from './utilsTonal';
import React from 'react';
import {el} from '@elemaudio/core';
import _ from 'lodash';
export const ElementaryContext = React.createContext({voices: {} as Record<string,Voice>, toggleVoice:(k,v)=>{}})
const synthFunc = (props: {freq: number, key: string})=>{
  return el.mul(el.cycle(el.const({value: props.freq, key:props.key})), 0.2)
}
export type Voice = {freqs: number[], id: string}
export const ElementaryContextProvider = ({children})=>{
  const [voices, setVoices] = useState<Record<string,Voice>>({})
  const toggleVoice = useCallback((key, freq: null|Voice|((freqNotes:Voice)=>void))=>{
    setVoices((prevVoices)=>{
      let {[key]: state, ...avs} = prevVoices
      let value: any = null
      if (typeof freq === 'function'){
        let freqFunc = freq as (freqNotes:Voice)=>void
        value = freqFunc(state)
      }else{
        value = freq
      }
      if (!_.isEqual(state, freq)){
        return {...avs, [key]:value}
      }
      return prevVoices
    })
  },[setVoices])
  const {core} = useContext(ElementaryAudioContext)
  const play = useCallback((notesFreq: (Voice&{key:string})[])=>{
    
    if (!notesFreq) notesFreq = []
    if (notesFreq.length>0){
      let toRender = notesFreq.map((n)=>n.freqs?n.freqs.map((f,i)=>synthFunc({freq: f, key:`${n.key}-${i}`} as {freq:number,key:string})): el.constant({value:0})).flat() 
      let out = el.add(...toRender)
      // console.log('rendering', JSON.stringify(toRender))
      core.render(out, out)
    }
  },[core])
  useEffect(()=>{
    let voicesMapped = Object.entries(voices).map((([touchId,noteFreq])=>{
      // return values.map((v,i)=>{
        return {...noteFreq, key:`${touchId}`}
      // })
    })).flat()
    console.log('render', voices)
    play(voicesMapped)
  },[voices, play])

  return <ElementaryContext.Provider value={{voices, toggleVoice}}>
    {children}
  </ElementaryContext.Provider>
}

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
    <FlowSelectorContext.Provider initialValue={{key:'A', scale:'dorian'}}>
      {/* <FlowSelector width={width} height={height*0.25} createNodesAndEdges={createMapScales} /> */}
      {/* <FlowSelector width={width} height={height} createNodesAndEdges={createDefinitiveMap} /> */}
      <Pad width={width} height={height}/>
    </FlowSelectorContext.Provider>
    </ElementaryContextProvider>
    :<button style={{width:'100%', height:window.innerHeight}} onClick={resumeAudio}>Play!</button>}
    </>
  );
}

export default Intro;


