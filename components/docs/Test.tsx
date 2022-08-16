import { useState } from "react";

const Test = ({ data }: { data: string }) => {
  const [number, setNumber] = useState(0);
  return (
    <div className="bg-red-300 flex flex-col w-min">
      <div className="w-32">
        Hello({data}) - {number}
      </div>
      <button className="rounded bg-blue-500" onClick={() => setNumber(number + 1)}>Click Me</button>
    </div>
  )
}

export default Test