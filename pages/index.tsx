import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'
const StudioContainer = dynamic(() => import('../src/containers/StudioContainer'), { ssr: false})

const Home: NextPage = () => {
  return (
    <StudioContainer />
  )
}

export default Home
