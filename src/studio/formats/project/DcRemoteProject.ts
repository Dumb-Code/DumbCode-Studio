import { loadDCMModel } from '../model/DCMLoader';
import DcProject from './DcProject';
import DcRemoteRepo, { RemoteProjectEntry } from './DcRemoteRepos';

export const loadRemoteProject = async(repo: DcRemoteRepo, entry: RemoteProjectEntry) => {
  const model = await loadRemoteModel(repo, entry)
  if(model === null) {
    alert("Unable to load model at \n" + entry.model)
    return null;
  }
  const project = new DcProject(entry.name, model)

  //TODO: load the rest of the projects :)

  return project
}

const loadRemoteModel = async(repo: DcRemoteRepo, entry: RemoteProjectEntry) => {
  const model = await repo.getContent(entry.model)
  if(model.type === "file") {
    const arraybuffer = Uint8Array.from(model.content, c => c.charCodeAt(0)).buffer
    return await loadDCMModel(arraybuffer, model.name)
  }
  return null
}