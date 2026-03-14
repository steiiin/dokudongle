import { Setting } from "./protocol/setting"

export interface Protocol {

  course: ProtocolCourse,
  specificVerbosity: null|ProtocolVerbosity,

  setting: Setting,

}

export function resetProtocol(): Protocol {
  const result: Protocol = {
    course: ProtocolCourse.TRANSPORT,
    specificVerbosity: null,
    setting: new Setting(),
  }
  return result
}

// #######################################################################

export enum ProtocolVerbosity {
  HIGH,
  NORMAL,
  LOW,
}

export enum ProtocolCourse {
  TRANSPORT,
  VERLEGUNG,
  EINWEISUNG,
  NEF_VOR_ORT,
}