import type { InferGetStaticPropsType } from 'next'
import Head from 'next/head'
import StudioContainer from '../src/containers/StudioContainer'


const Home = ({ githubClientId }: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no" />
        <meta name="description" content="description of your project" />
        <meta name="theme-color" content="#262626" />
        <title>Dumbcode Studio</title>
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png"></link>
      </Head>
      <StudioContainer githubClientId={githubClientId} />
    </>
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
