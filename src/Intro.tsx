import { useContext, useState } from 'react';
import { ElementaryAudioContext } from '.';
// import { read } from "midifile-ts"
import Pad from './Pad';



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
  return (
    <>
    {ready?<Pad />:<button style={{width:'100%', height:window.innerHeight}} onClick={resumeAudio}>Play!</button>}
    </>
  );
}

export default Intro;


