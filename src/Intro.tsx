import { useContext, useState } from 'react';
import { useWindowSize } from 'react-use-size';
import { ElementaryAudioContext } from '.';
// import { read } from "midifile-ts"
import Pad from './Pad';
import FlowSelector, { FlowSelectorContext } from './FlowSelector';



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
    <FlowSelectorContext.Provider initialValue={{key:'C', scale:'mixolydian'}}>
      <FlowSelector width={width} height={height*0.35}/>
      <Pad width={width} height={height*0.75}/>
    </FlowSelectorContext.Provider>
    :<button style={{width:'100%', height:window.innerHeight}} onClick={resumeAudio}>Play!</button>}
    </>
  );
}

export default Intro;


