import dynamic from "next/dynamic"
import React from "react"

const WrapNoSSR = <P,>(Element: React.FC<P>) => dynamic(Promise.resolve(Element), { ssr: false })
export default WrapNoSSR