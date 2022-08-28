import { useEffect } from 'react';

//Fixed an issue on firefox where the alt key opens the context menu.
//Due to keycombos using alt, and using the keydown event,
//There is no real way to know if a keypress is an actionalable keypress (used in a keycombo)
//Therefore, we can just prevent default on all keyup events.
const useNoDefaultKeypresses = () => {
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault()
    document.addEventListener('keyup', preventDefault)
    return () => {
      document.removeEventListener('keyup', preventDefault)
    }
  }, [])
}

export default useNoDefaultKeypresses