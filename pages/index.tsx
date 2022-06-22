import type { InferGetStaticPropsType } from 'next'
import dynamic from 'next/dynamic'
const StudioContainer = dynamic(() => import('../src/containers/StudioContainer'), { ssr: false })


const Home = ({ githubClientId }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <StudioContainer githubClientId={githubClientId} />
  )
}

export const getStaticProps = async () => {
  return {
    props: {
      githubClientId: process.env.GITHUB_CLIENT_ID ?? ''
    },
  }
}

export default Home
