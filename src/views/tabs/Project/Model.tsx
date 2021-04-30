import { useStudio } from "../../../contexts/StudioContext";
import DcProject, { newProject } from "../../../studio/formats/DcProject";
import { loadDCMModel } from "../../../studio/formats/model/DCMLoader";
import DoubleClickToEdit from "../../../util/DoubleClickToEdit";

export default () => {
  const { projects, setProjects, selectedProject, setSelectedProject } = useStudio()

  const addProject = (project: DcProject) => {
    const array = projects.slice(0)
    array.push(project)
    setProjects(array)
  }


  return (
    <>
      <div
        className="columns is-mobile model-layer-topbar has-background-black-bis mx-0 mb-0"
        style={{
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px"
        }}
      >
        <div className="column">
          <h1 className="title is-5 ml-3">MODEL</h1>
        </div>
        <div className="column is-narrow">
          <span
            className="new-model-button icon is-small clickable tooltip"
            data-tooltip="Create New Model"
            onClick={() => addProject(newProject())}
          >
            <i className="fas fa-plus"></i>
          </span>
        </div>
        <div className="column is-narrow">
          <div className="clickable tooltip" data-tooltip="Upload New Model">
            <label htmlFor="model-file-input">
              <div className="icon is-small">
                <i className="fas fa-upload"></i>
              </div>
            </label>
            <input
              onInput={e => {
                const files = e.currentTarget.files
                if(files) {
                  for(let i = 0; i < files.length; i++) {
                    const f = files.item(i)
                    if(f) {
                      loadDCMModel(f.arrayBuffer(), f.name)
                      .then(model => addProject(new DcProject(f.name.substring(0, f.name.lastIndexOf(".")), model)))
                    }
                  }
                }
              }}
              id="model-file-input"
              className="file-input-hidden"
              type="file"
              accept=".tbl,.dcm,.bbmodel"
              multiple
            />
          </div>
        </div>
        <div className="column is-narrow">
          <div className="clickable tooltip" data-tooltip="Import as Project">
            <label htmlFor="project-file-input">
              <div className="icon is-small">
                <i className="fas fa-file-import"></i>
              </div>
            </label>
            <input
              id="project-file-input"
              className="file-input-hidden"
              type="file"
              accept=".dcproj"
              multiple
            />
          </div>
        </div>
        <div className="column is-narrow">
          <span
            className="icon is-small clickable tooltip popup-modal-button"
            modal-target="project/remote/repositories"
            data-tooltip="Add Remote Project"
          >
            <i className="fab fa-github"></i>
          </span>
        </div>
      </div>
      <div
        className="model-list pr-4 mt-0 pt-5"
        style={{
          overflowY: "scroll",
          overflowX: "hidden",
          height: "82vh"
        }}
      >
        {projects.map(p => <ModelEntry key={p.identifier} project={p} />)}
      </div>
    </>
  );
}

const ModelEntry = ({project}: {project: DcProject}) => {
  return (
    <div className="model-list-entry columns is-mobile">
      <div className="column is-narrow model-preview"></div>
      <DoubleClickToEdit callback={name => project.setName(name)} current={project.name} />
      <div
        className="column is-narrow github-sync"
        style={{
          display: "none"
        }}
      >
        <span
          className="sync-project-button icon is-small clickable tooltip"
          data-tooltip="Push To Github"
        >
          <i className="fas fa-sync"></i>
        </span>
      </div>
      <div className="column is-narrow">
        <span
          className="download-project-file icon is-small clickable tooltip"
          data-tooltip="Download As Project"
        >
          <i className="fas fa-file-export"></i>
        </span>
      </div>
      <div className="column is-narrow">
        <span
          className="download-model-file icon is-small clickable tooltip "
          data-tooltip="Download Model"
        >
          <i className="fas fa-file-download"></i>
        </span>
      </div>
      <div className="column is-narrow">
        <span
          className="close-model-button icon is-small clickable tooltip icon-close-button"
          data-tooltip="Close Model"
        >
          <i className="fas fa-times-circle"></i>
        </span>
      </div>
    </div>
  )
}