import { useEffect, useRef } from "react"

export const useWhenAction = (action: "create_new_model" | "last_remote_repo_project", fn: () => void | Promise<void>) => {
  const handled = useRef(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const urlAction = new URLSearchParams(window.location.search).get("action")
    if (action === urlAction && !handled.current) {
      handled.current = true
      void fn()
    }
  }, [action, fn])
}
