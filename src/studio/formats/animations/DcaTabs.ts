import { LO } from './../../util/ListenableObject';
import DcaAnimation from "./DcaAnimation";

export default class DcaTabs {
  readonly animations = new LO<readonly DcaAnimation[]>([])
  readonly tabs = new LO<readonly string[]>([])
  readonly selectedAnimation = new LO<DcaAnimation|null>(null)
} 