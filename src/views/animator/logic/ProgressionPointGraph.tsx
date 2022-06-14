import { ProgressionPoint } from "../../../studio/formats/animations/DcaAnimation"

export type GraphType = "Sin" | "Quadratic" | "Cubic" | "Quartic" | "Quintic" | "Exponential" | "Circular" | "Back" | "Elastic" | "Bounce" | "Custom" | "None"

//This is all old code, it'll be redone when I get round to it
export const drawProgressionPointGraph = (type: GraphType, resolution: number, isIn: boolean, isOut: boolean): ProgressionPoint[] => {
  const points: ProgressionPoint[] = [
    { x: 0, y: 1, required: true },
    { x: 1, y: 0, required: true },
  ]

  resolution = Math.min(Math.max(resolution, 5), 50)

  let funcRaw: (x: number) => number
  switch (type) {
    case "Sin":
      funcRaw = x => 1 - Math.cos((x * Math.PI) / 2)
      break

    case "Quadratic":
      funcRaw = x => x * x
      break

    case "Cubic":
      funcRaw = x => x * x * x
      break

    case "Quartic":
      funcRaw = x => x * x * x * x
      break

    case "Quintic":
      funcRaw = x => x * x * x * x * x
      break

    case "Exponential":
      funcRaw = x => Math.pow(2, 10 * x - 10)
      break

    case "Circular":
      funcRaw = x => 1 - Math.sqrt(1 - Math.pow(x, 2))
      break

    case "Back":
      funcRaw = x => 2.70158 * x * x * x - 1.70158 * x * x
      break

    case "Elastic":
      funcRaw = x => -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * (2 * Math.PI) / 3)
      break

    case "Bounce":
      funcRaw = xIn => {
        let x = 1 - xIn

        const n1 = 7.5625;
        const d1 = 2.75;

        let res
        if (x < 1 / d1) {
          res = n1 * x * x;
        } else if (x < 2 / d1) {
          res = n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
          res = n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
          res = n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
        return 1 - res
      }
      break

    default:
      return points
  }

  //Gets the function with the in/out applied.
  let func: (x: number) => number
  if (isIn === true) {
    if (isOut === true) {
      //inout
      func = x => x < 0.5 ? funcRaw(2 * x) / 2 : 1 - funcRaw(2 - 2 * x) / 2
    } else {
      //in
      func = x => funcRaw(x)
    }
  } else {
    if (isOut === true) {
      //out
      func = x => 1 - funcRaw(1 - x)
    } else {
      //none (linear)
      func = x => x
    }
  }

  for (let i = 1; i < resolution; i++) {
    points.push({
      x: i / resolution,
      y: 1 - func(i / resolution)
    })
  }


  return points
}