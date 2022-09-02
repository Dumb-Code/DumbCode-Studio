import { SvgCopypaste, SVGDownload, SVGOpenLink, SVGUpload } from "@dumbcode/shared/icons";
import { SVGProps } from 'react';
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
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID 1b01948f72fbc4f`
      },
      body: formData
    })
    const json = await response.json()
    if (response.status !== 200) {
      throw new Error(`Failed to upload screenshot to Imgur: ${response.status}, ${json.data.error}`)
    }
    return navigator.clipboard?.writeText(json.data.link)
  }
}

export const ScreenshotDesciptionMap: Record<ScreenshotActionType, string> = {
  download: "Downloaded",
  open_in_new_tab: "Opened in new tab",
  copy_to_clipboard: "Copy to clipboard",
  upload_to_imgur: "Uploaded to Imgur and copied URL to clipboard"
}

export const ScreenshotIconMap: Record<ScreenshotActionType, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  download: SVGDownload,
  open_in_new_tab: SVGOpenLink,
  copy_to_clipboard: SvgCopypaste,
  upload_to_imgur: SVGUpload
}

export const AllScreenshotActionTypes = Object.keys(ScreenshotActionMap) as ScreenshotActionType[]