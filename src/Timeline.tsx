import { autoContextProviderFactory } from "./utils";
enum TimelineStatus {
    PLAYING="playing",
    STOPPED="stopped"
}
const TimelineContext = autoContextProviderFactory<{
    replay?: boolean;
    status: TimelineStatus;
    data?: object[];
    currentVoices?: object[]
  }>({ replay: false, status: TimelineStatus.STOPPED, data: [], currentVoices: [] }, "Timeline");
// on play -> counter on -> currentVoices changed depending on data
const Timeline = (props)=>{
    return <div>timeline</div>
}
export default Timeline