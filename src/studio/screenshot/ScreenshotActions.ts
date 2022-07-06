import { downloadBlob } from '../files/FileTypes';
export type ScreenshotActionType = "download" | "open_in_new_tab" | "copy_to_clipboard" | "upload_to_imgur"

type ScreenshotAction = (screenshot: Blob) => any | Promise<any>

export const ScreenshotActionMap: Record<ScreenshotActionType, ScreenshotAction> = {
  download: screenshot => downloadBlob("screenshot.png", screenshot),
  open_in_new_tab: screenshot => window.open(URL.createObjectURL(screenshot)),
  copy_to_clipboard: screenshot => navigator.clipboard?.write([new ClipboardItem({ [screenshot.type]: screenshot })])
  ,
  upload_to_imgur: async (screenshot) => {
    const formData = new FormData()
    formData.append("image", screenshot, "screenshot.png")
    const json = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID 1b01948f72fbc4f`
      },
      body: formData
    }).then(res => res.json())
    return navigator.clipboard?.writeText(json.data.link)
  }
}

export const AllScreenshotActionTypes = Object.keys(ScreenshotActionMap) as ScreenshotActionType[]