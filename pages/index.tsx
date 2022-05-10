import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
const StudioContainer = dynamic(() => import('../src/containers/StudioContainer'), { ssr: false })

const Home: NextPage = () => {
  return (
    <StudioContainer />
  )
}

export default Home
