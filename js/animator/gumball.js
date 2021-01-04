import { CubeGeometry, Euler, Group, Mesh, MeshLambertMaterial, Object3D, Quaternion, Vector3 } from "../three.js";
import { Bone3D, Chain3D, Structure3D, V3 } from "../fik.js"
import { LinkedSelectableList, LinkedElement, ToggleableElement } from "../util.js";

const translateIK = "translate-ik"
const translate = "translate"

const tempVec = new Vector3()
const tempQuat = new Quaternion()
const worldQuat = new Quaternion()
const tempEuler = new Euler()
tempEuler.order = "ZYX"

/**
 * The animation gumball.
 */
export class Gumball {
    
    /**
     * @param {*} dom The animation studio dom
     * @param {*} studio the animation studio
     */
    constructor(dom, studio) {
        this.raytracer = studio.raytracer
        this.transformControls = studio.transformControls

        let ikSolver = new Structure3D()

        //Starting rot/pos is the starting position/rotation for the selected cube.
        //Used to interpolate properly
        let startingRot = new Vector3()
        let startingPos = new Vector3()

        let ikData = []
        let ikStartingRotation = new Quaternion()
        this.ikAnchor = new Object3D()
        this.ikAnchor.rotation.order = "ZYX"
        studio.group.add(this.ikAnchor)

        this.transformControls.addEventListener('mouseUp', () => {
            ikSolver.clear()
            ikData.length = 0
        })
        this.transformControls.addEventListener('mouseDown', () => {
            let selected = this.raytracer.oneSelected()
            if(selected === null) {
                return
            }

            ikSolver.clear()
            ikData.length = 0

            let handler = studio.pth.animationTabs.active
            if(handler !== null && this.transformType.value === translateIK) {
                let chain = new Chain3D()
                //Get a list from the selected cube to either the root cube, or a cube marked as IK locked
                let allCubes = []
                for(let cube = selected.tabulaCube; cube.parent !== undefined; cube = cube.parent) {
                    allCubes.push(cube)
                    //Cube is ik locked
                    if(handler.ikaCubes.includes(cube.name)) {
                        break
                    }
                }
                allCubes.reverse()
                let previousPosition = null
                let previousCube = null
                //Iterate over those cubes, createing bones inbetween the cubes.
                allCubes.forEach(cube => {
                    let p = cube.cubeGroup.getWorldPosition(tempVec)
                    //not the first time
                    if(previousPosition !== null) {
                        let start = new V3(...previousPosition)
                        let end = new V3(p.x, p.y, p.z)
                        let bone = new Bone3D(start, end)
                        
                        ikData.push( { 
                            cube: previousCube, 
                            startingWorldRot: previousCube.cubeGroup.getWorldQuaternion(new Quaternion()),
                            offset: new Vector3(end.x-start.x, end.y-start.y, end.z-start.z).normalize() ,
                        } )
                        chain.addBone(bone)
                    }
                    previousPosition = p.toArray()  
                    previousCube = cube
                })
                ikSolver.add(chain, this.ikAnchor.position)
                ikSolver.update()
                selected.cubeGroup.getWorldQuaternion(ikStartingRotation)
            }

            startingRot.x = selected.cubeGroup.rotation.x
            startingRot.y = selected.cubeGroup.rotation.y
            startingRot.z = selected.cubeGroup.rotation.z

            startingPos.copy(selected.cubeGroup.position)
        })
        

        //Handle the rotate data. 
        this.transformControls.addEventListener('studioRotate', e => {
            let selected = this.raytracer.oneSelected()
            if(selected === null) {
                return
            }

            let rot = selected.cubeGroup.rotation
            rot.x = startingRot.x + e.rotationAngle * e.rotationAxis.x
            rot.y = startingRot.y + e.rotationAngle * e.rotationAxis.y
            rot.z = startingRot.z + e.rotationAngle * e.rotationAxis.z

            let rotations = rot.toArray().map(a => a * 180 / Math.PI)
            studio.setRotation(rotations)
            studio.runFrame()
        })

        //Handle the translate data
        this.transformControls.addEventListener('studioTranslate', e => {
            let selected = this.raytracer.oneSelected()            
            if(selected !== null && this.transformType.value !== translateIK) {
                selected.cubeGroup.position.copy(e.axis).multiplyScalar(e.length).add(startingPos)
                studio.setPosition(selected.cubeGroup.position.toArray())
                studio.runFrame()
            }
        })

        //Handles the inverse kinematics
        this.transformControls.addEventListener('objectChange', () => {
            let handler = studio.pth.animationTabs.active
            if(this.transformType.value === translateIK && handler !== null) {
                //We rely on some three.js element math stuff, so we need to make sure the model is animated correctly
                studio.pth.model.resetAnimations()
                studio.keyframeManager.setForcedAniamtionTicks()
                handler.animate(0)
                studio.pth.model.modelCache.updateMatrixWorld(true)

                let selected = this.raytracer.oneSelected()            
                if(selected === null) {
                    return
                }
                ikSolver.update()
                let pushData = []

                ikData.forEach((d, i) => {
                    let bone = ikSolver.chains[0].bones[i]
                    //Get the change in rotation that's been done.
                    //This way we can preserve the starting rotation. 
                    tempVec.set(bone.end.x-bone.start.x, bone.end.y-bone.start.y, bone.end.z-bone.start.z).normalize()
                    tempQuat.setFromUnitVectors(d.offset, tempVec)

                    //      parent_world * local = world
                    //  =>  local = 'parent_world * world
                    let element = d.cube.cubeGroup
                    let worldRotation = tempQuat.multiply(d.startingWorldRot)
                    let quat = element.parent.getWorldQuaternion(worldQuat).inverse().multiply(worldRotation)

                    //Get the euler angles and set it to the rotation. Push these changes.
                    let rot = d.cube.cubeGroup.rotation
                    rot.setFromQuaternion(quat)

                    let rotations = rot.toArray().map(a => a * 180 / Math.PI)
                    pushData.push( { rotations, cube: d.cube} )
                    d.cube.cubeGroup.updateMatrixWorld()
                })

                //We need to have the selected cube have the same axis. So here it basically "inverts" the parent changes.
                selected.cubeGroup.parent.updateMatrixWorld()
                let quat = selected.cubeGroup.parent.getWorldQuaternion(worldQuat).inverse().multiply(ikStartingRotation)
                tempEuler.setFromQuaternion(quat)
                let rotations = tempEuler.toArray().map(a => a * 180 / Math.PI)
                
                //@todo: maybe in the future we can have a way to do all the changes together, rather than one at a time
                //as the studio re-animates the entire model at least once when changes are made.
                studio.setRotation(rotations)
                pushData.forEach(d => studio.setRotation(d.rotations, false, false, d.cube))
            }
        })

        //Creates the transform type and global mode toggle elements.
        this.transformType = new LinkedSelectableList(dom.find('.transform-control-tool'), false).onchange(() => this.selectChanged())
        this.globalMode = new ToggleableElement(dom.find('.transform-control-global')).onchange(e => this.transformControls.space = e.value ? 'world' : 'local')
        
        this.raytracer.addEventListener('selectchange', () => this.selectChanged())
    }

    /**
     * Called when a cube selection changes or the transform type changes.
     */
    selectChanged() {
        if(this.transformType.value === translateIK) {
            this.setMode(translate, true)
        } else {
            this.setMode(this.transformType.value)
        }
    }

    /**
     * Sets the mode for the transform tools, or detaches the transform tools if no cubes are selected.
     * @param {string} mode the mode to set as. Should be `translate` or `rotate`
     * @param {boolean} isIk true if is inverse kinematics, false otherwise
     */
    setMode(mode, isIk = false) {
        let selected = this.raytracer.oneSelected()
        if(selected === null || mode === null || mode === undefined) {
            this.transformControls.detach()
        } else {
            if(isIk) {
                selected.matrixWorld.decompose(this.ikAnchor.position, this.ikAnchor.quaternion, tempVec)
            }
            this.transformControls.attach(isIk ? this.ikAnchor : selected.parent );
            this.transformControls.mode = mode
        }
    }
}