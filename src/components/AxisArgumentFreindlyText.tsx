
const AxisArgumentFreindlyText = (axis: string, integer: boolean) => ({ errorData, isParsed }: { errorData: any, isParsed: boolean }) => {
  let axisArr: number[] | null = null
  let axisDone: number | null = null


  if (Array.isArray(errorData)) {
    axisArr = errorData
  } else {
    axisArr = errorData?.axisValues ?? null
    axisDone = errorData?.axisDone ?? null
  }


  let className = ""
  if (!isParsed && (axisArr === null || axisArr.length === 0)) {
    className = "font-bold text-red-500"
  } else if (isParsed || axisDone !== null) {
    className = "text-green-500"
  }

  const ax = axisDone ?? 0

  return (
    <>
      <span className={className}>{axis}</span>
      {" "}
      {axisArr !== null && axisArr.map((a, i) => {
        let className = ""
        if (i >= ax) {
          className = "text-red-500"
          if (i === ax) {
            className = className + " font-bold"
          }
        } else {
          className = "text-green-500"
        }
        return (
          <span
            key={i}
            className={className}
          >
            [{integer ? "whole number" : "number"} {axis[a]}]{" "}
          </span>
        )
      }
      )}
    </>
  )
}

export default AxisArgumentFreindlyText