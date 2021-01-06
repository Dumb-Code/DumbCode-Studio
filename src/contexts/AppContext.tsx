import React from 'react';

const AppContext = React.createContext({
  projectFiles: null
})
function useAppContext() {
  const context = React.useContext(AppContext)
  if (!context) {
    throw new Error(`useCount must be used within a CountProvider`)
  }
  return context
}
function AppProvider(props) {
  const [projectFiles, setProjectFiles] = React.useState(null)
  const value = React.useMemo(() => [projectFiles, setProjectFiles], [projectFiles])
  return <AppContext.Provider value={value} {...props} />
}
export { AppProvider, useAppContext }