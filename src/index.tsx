import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import WebRenderer from "@elemaudio/web-renderer";
import App from './App';
declare global {
  interface Window {
    webkitAudioContext: any
  }
}
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext // Safari and old versions of Chrome
const audioContext: AudioContext = new AudioContext({
  latencyHint: "interactive",
  sampleRate: 44100,
});


const core: WebRenderer = new WebRenderer();
export const ElementaryAudioContext = React.createContext({core, audioContext})
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
core.on("load", () => {
  core.on("error", (e: unknown) => {
    console.error("conre error: ", e);
  });
  root.render(
    <React.StrictMode>
      <ElementaryAudioContext.Provider value={{core,audioContext}}>
      <App />
      </ElementaryAudioContext.Provider>
    </React.StrictMode>
  );
})
async function main() {
  let node = await core.initialize(audioContext, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2],
  });
  node.connect(audioContext.destination);
}
main()
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

