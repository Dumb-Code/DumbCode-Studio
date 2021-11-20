declare module '@aminere/fullik' {
  /** Declaration file generated by dts-gen */

  export class Bone2D {
    constructor(Start: any, End: any, directionUV: any, length: any, clockwiseDegs: any, anticlockwiseDegs: any, color: any);

    clone(): any;

    getBoneConnectionPoint(): any;

    getDirectionUV(): any;

    getGlobalConstraintUV(): any;

    getLength(): any;

    setAnticlockwiseConstraintDegs(angleDegs: any): void;

    setBoneConnectionPoint(bcp: any): void;

    setClockwiseConstraintDegs(angleDegs: any): void;

    setColor(c: any): void;

    setEndLocation(v: any): void;

    setGlobalConstraintUV(v: any): void;

    setJoint(joint: any): void;

    setJointConstraintCoordinateSystem(coordSystem: any): void;

    setLength(length: any): void;

    setName(name: any): void;

    setStartLocation(v: any): void;

  }

  export class Bone3D {
    constructor(startLocation: any, endLocation: any, directionUV?: any, length?: any, color?: any);

    start: V3
    end: V3

    clone(): any;

    getBoneConnectionPoint(): any;

    getDirectionUV(): any;

    getLength(): any;

    init(startLocation: any, endLocation: any, directionUV: any, length: any): void;

    setBallJointConstraintDegs(angle: any): void;

    setBoneConnectionPoint(bcp: any): void;

    setColor(c: any): void;

    setEndLocation(location: any): void;

    setHingeAnticlockwise(angle: any): void;

    setHingeClockwise(angle: any): void;

    setJoint(joint: any): void;

    setLength(lng: any): void;

    setStartLocation(location: any): void;

  }

  export class Chain2D {
    constructor(color: any);

    addBone(bone: any): void;

    addConsecutiveBone(directionUV: any, length: any, clockwiseDegs: any, anticlockwiseDegs: any, color: any): void;

    clear(): void;

    clone(): any;

    cloneBones(): any;

    getBaseLocation(): any;

    getBaseboneConstraintType(): any;

    getBaseboneConstraintUV(): any;

    getBoneConnectionPoint(): any;

    getConnectedBoneNumber(): any;

    getConnectedChainNumber(): any;

    getEffectorLocation(): any;

    getEmbeddedTarget(): any;

    getLastTargetLocation(): any;

    getLiveChainLength(): any;

    removeBone(id: any): void;

    resetTarget(): void;

    setBaseLocation(baseLocation: any): void;

    setBaseboneConstraintType(value: any): void;

    setBaseboneConstraintUV(constraintUV: any): void;

    setBaseboneRelativeConstraintUV(constraintUV: any): void;

    setBoneConnectionPoint(point: any): void;

    setColor(color: any): void;

    setConnectedBoneNumber(boneNumber: any): void;

    setConnectedChainNumber(chainNumber: any): void;

    setFixedBaseMode(value: any): void;

    setMaxIterationAttempts(maxIteration: any): void;

    setMinIterationChange(minIterationChange: any): void;

    setSolveDistanceThreshold(solveDistance: any): void;

    solveForEmbeddedTarget(): any;

    solveForTarget(t: any): any;

    solveIK(target: any): any;

    updateChainLength(): void;

  }

  export class Chain3D {
    constructor(color?: any);

    addBone(bone: any): void;

    addConsecutiveBone(directionUV: any, length: any): void;

    addConsecutiveFreelyRotatingHingedBone(directionUV: any, length: any, type: any, hingeRotationAxis: any): void;

    addConsecutiveHingedBone(DirectionUV: any, length: any, type: any, HingeRotationAxis: any, clockwiseDegs: any, anticlockwiseDegs: any, hingeReferenceAxis: any): void;

    addConsecutiveRotorConstrainedBone(boneDirectionUV: any, length: any, constraintAngleDegs: any): void;

    clear(): void;

    clone(): any;

    cloneBones(): any;

    getBaseLocation(): any;

    getBaseboneConstraintType(): any;

    getBaseboneConstraintUV(): any;

    getBaseboneRelativeReferenceConstraintUV(): any;

    getBoneConnectionPoint(): any;

    getConnectedBoneNumber(): any;

    getConnectedChainNumber(): any;

    getEffectorLocation(): any;

    getLastTargetLocation(): any;

    getLiveChainLength(): any;

    removeBone(id: any): void;

    resetTarget(): void;

    setBaseLocation(baseLocation: any): void;

    setBaseboneConstraintUV(uv: any): void;

    setBaseboneRelativeConstraintUV(uv: any): void;

    setBaseboneRelativeReferenceConstraintUV(uv: any): void;

    setBoneConnectionPoint(point: any): void;

    setColor(c: any): void;

    setConnectedBoneNumber(boneNumber: any): void;

    setConnectedChainNumber(chainNumber: any): void;

    setFixedBaseMode(value: any): void;

    setFreelyRotatingGlobalHingedBasebone(hingeRotationAxis: any): void;

    setFreelyRotatingLocalHingedBasebone(hingeRotationAxis: any): void;

    setGlobalHingedBasebone(hingeRotationAxis: any, cwDegs: any, acwDegs: any, hingeReferenceAxis: any): void;

    setHingeBaseboneConstraint(type: any, hingeRotationAxis: any, cwDegs: any, acwDegs: any, hingeReferenceAxis: any): void;

    setLocalHingedBasebone(hingeRotationAxis: any, cwDegs: any, acwDegs: any, hingeReferenceAxis: any): void;

    setMaxIterationAttempts(maxIterations: any): void;

    setMinIterationChange(minIterationChange: any): void;

    setRotorBaseboneConstraint(type: any, constraintAxis: any, angleDegs: any): void;

    setSolveDistanceThreshold(solveDistance: any): void;

    solveForEmbeddedTarget(): any;

    solveForTarget(t: any): any;

    solveIK(target: any): any;

    updateChainLength(): void;

  }

  export class HISolver {
    constructor(o: any);

    createChain(): void;

    initStructure(o: any): void;

    update(): void;

  }

  export class IKSolver {
    constructor(o: any);

  }

  export class Joint2D {
    constructor(clockwise: any, antiClockwise: any, coordSystem: any);

    clone(): any;

    getConstraintCoordinateSystem(): any;

    set(joint: any): void;

    setAnticlockwiseConstraintDegs(angle: any): void;

    setClockwiseConstraintDegs(angle: any): void;

    setConstraintCoordinateSystem(coordSystem: any): void;

    validateAngle(a: any): any;

  }

  export class Joint3D {
    constructor();

    clone(): any;

    getHingeReferenceAxis(): any;

    getHingeRotationAxis(): any;

    setAsBallJoint(angle: any): void;

    setBallJointConstraintDegs(angle: any): void;

    setHinge(type: any, rotationAxis: any, clockwise: any, anticlockwise: any, referenceAxis: any): void;

    setHingeAnticlockwise(angle: any): void;

    setHingeClockwise(angle: any): void;

    testAngle(): void;

    validateAngle(a: any): any;

  }

  export class M3 {
    constructor(...args: any[]);

    createRotationMatrix(referenceDirection: any): any;

    identity(): any;

    rotateAboutAxis(v: any, angle: any, rotationAxis: any): any;

    set(n11: any, n12: any, n13: any, n21: any, n22: any, n23: any, n31: any, n32: any, n33: any): any;

    setV3(xAxis: any, yAxis: any, zAxis: any): any;

    transpose(): any;

  }

  export class Structure2D {
    constructor();

    add(chain: any, target: any): void;

    clear(): void;

    connectChain(Chain: any, chainNumber: any, boneNumber: any, point: any, target: any, meshBone: any, color: any): void;

    getChain(id: any): any;

    getNumChains(): any;

    remove(id: any): void;

    setFixedBaseMode(value: any): void;

    update(): void;

  }

  export class Structure3D {
    constructor();

    chains: any[]

    add(chain: any, target: any): void;

    clear(): void;

    connectChain(Chain: any, chainNumber: any, boneNumber: any, point: any, target: any, meshBone: any, color: any): void;

    getChain(id: any): any;

    getNumChains(): any;

    remove(id: any): void;

    setFixedBaseMode(value: any): void;

    update(): void;

  }

  export class V2 {
    constructor(x: any, y: any);

    add(v: any): any;

    angleTo(v: any): any;

    approximatelyEquals(v: any, t: any): any;

    clone(): any;

    constrainedUV(baselineUV: any, min: any, max: any): any;

    copy(v: any): any;

    cross(v: any): any;

    distanceTo(v: any): any;

    distanceToSquared(v: any): any;

    divideBy(value: any): any;

    divideScalar(scalar: any): any;

    dot(a: any, b: any): any;

    getSignedAngle(v: any): any;

    length(): any;

    lengthSq(): any;

    min(v: any): any;

    minus(v: any): any;

    multiplyScalar(scalar: any): any;

    negate(): any;

    negated(): any;

    normalised(): any;

    normalize(): any;

    plus(v: any): any;

    rotate(angle: any): any;

    set(x: any, y: any): any;

    sign(v: any): any;

  }

  export class V3 {
    constructor(x: any, y: any, z: any);

    x: number;
    y: number;
    z: number;

    abs(): any;

    add(v: any): any;

    angleTo(v: any): any;

    applyM3(m: any): any;

    applyMatrix3(m: any): any;

    applyQuaternion(q: any): any;

    approximatelyEquals(v: any, t: any): any;

    clone(): any;

    constrainedUV(referenceAxis: any, rotationAxis: any, mtx: any, min: any, max: any): any;

    copy(v: any): any;

    cross(v: any): any;

    crossVectors(a: any, b: any): any;

    distanceTo(v: any): any;

    distanceToSquared(v: any): any;

    divideBy(s: any): any;

    divideScalar(scalar: any): any;

    dot(v: any): any;

    getSignedAngle(v: any, normal: any): any;

    length(): any;

    lengthSq(): any;

    limitAngle(base: any, mtx: any, max: any): any;

    min(v: any): any;

    minus(v: any): any;

    multiply(s: any): any;

    multiplyScalar(scalar: any): any;

    negate(): any;

    negated(): any;

    normalised(): any;

    normalize(): any;

    plus(v: any): any;

    projectOnPlane(planeNormal: any): any;

    projectOnVector(vector: any): any;

    rotate(angle: any, axe: any): any;

    set(x: any, y: any, z: any): any;

    sign(v: any, normal: any): any;

    zero(): any;

  }

  export const END: number;

  export const GLOBAL_ABSOLUTE: number;

  export const GLOBAL_HINGE: number;

  export const GLOBAL_ROTOR: number;

  export const J_BALL: number;

  export const J_GLOBAL: number;

  export const J_LOCAL: number;

  export const LOCAL_ABSOLUTE: number;

  export const LOCAL_HINGE: number;

  export const LOCAL_RELATIVE: number;

  export const LOCAL_ROTOR: number;

  export const MAX_VALUE: number;

  export const NONE: number;

  export const PI: number;

  export const PRECISION: number;

  export const PRECISION_DEG: number;

  export const REVISION: string;

  export const START: number;

  export const TODEG: number;

  export const TORAD: number;

  export namespace DOWN {
    const isVector2: boolean;

    const x: number;

    const y: number;

    function add(v: any): any;

    function angleTo(v: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(baselineUV: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(value: any): any;

    function divideScalar(scalar: any): any;

    function dot(a: any, b: any): any;

    function getSignedAngle(v: any): any;

    function length(): any;

    function lengthSq(): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function rotate(angle: any): any;

    function set(x: any, y: any): any;

    function sign(v: any): any;

  }

  export namespace LEFT {
    const isVector2: boolean;

    const x: number;

    const y: number;

    function add(v: any): any;

    function angleTo(v: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(baselineUV: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(value: any): any;

    function divideScalar(scalar: any): any;

    function dot(a: any, b: any): any;

    function getSignedAngle(v: any): any;

    function length(): any;

    function lengthSq(): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function rotate(angle: any): any;

    function set(x: any, y: any): any;

    function sign(v: any): any;

  }

  export namespace RIGHT {
    const isVector2: boolean;

    const x: number;

    const y: number;

    function add(v: any): any;

    function angleTo(v: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(baselineUV: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(value: any): any;

    function divideScalar(scalar: any): any;

    function dot(a: any, b: any): any;

    function getSignedAngle(v: any): any;

    function length(): any;

    function lengthSq(): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function rotate(angle: any): any;

    function set(x: any, y: any): any;

    function sign(v: any): any;

  }

  export namespace UP {
    const isVector2: boolean;

    const x: number;

    const y: number;

    function add(v: any): any;

    function angleTo(v: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(baselineUV: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(value: any): any;

    function divideScalar(scalar: any): any;

    function dot(a: any, b: any): any;

    function getSignedAngle(v: any): any;

    function length(): any;

    function lengthSq(): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function rotate(angle: any): any;

    function set(x: any, y: any): any;

    function sign(v: any): any;

  }

  export namespace X_AXE {
    const isVector3: boolean;

    const x: number;

    const y: number;

    const z: number;

    function abs(): any;

    function add(v: any): any;

    function angleTo(v: any): any;

    function applyM3(m: any): any;

    function applyMatrix3(m: any): any;

    function applyQuaternion(q: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(referenceAxis: any, rotationAxis: any, mtx: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function crossVectors(a: any, b: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(s: any): any;

    function divideScalar(scalar: any): any;

    function dot(v: any): any;

    function getSignedAngle(v: any, normal: any): any;

    function length(): any;

    function lengthSq(): any;

    function limitAngle(base: any, mtx: any, max: any): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiply(s: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function projectOnPlane(planeNormal: any): any;

    function projectOnVector(vector: any): any;

    function rotate(angle: any, axe: any): any;

    function set(x: any, y: any, z: any): any;

    function sign(v: any, normal: any): any;

    function zero(): any;

  }

  export namespace X_NEG {
    const isVector3: boolean;

    const x: number;

    const y: number;

    const z: number;

    function abs(): any;

    function add(v: any): any;

    function angleTo(v: any): any;

    function applyM3(m: any): any;

    function applyMatrix3(m: any): any;

    function applyQuaternion(q: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(referenceAxis: any, rotationAxis: any, mtx: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function crossVectors(a: any, b: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(s: any): any;

    function divideScalar(scalar: any): any;

    function dot(v: any): any;

    function getSignedAngle(v: any, normal: any): any;

    function length(): any;

    function lengthSq(): any;

    function limitAngle(base: any, mtx: any, max: any): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiply(s: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function projectOnPlane(planeNormal: any): any;

    function projectOnVector(vector: any): any;

    function rotate(angle: any, axe: any): any;

    function set(x: any, y: any, z: any): any;

    function sign(v: any, normal: any): any;

    function zero(): any;

  }

  export namespace Y_AXE {
    const isVector3: boolean;

    const x: number;

    const y: number;

    const z: number;

    function abs(): any;

    function add(v: any): any;

    function angleTo(v: any): any;

    function applyM3(m: any): any;

    function applyMatrix3(m: any): any;

    function applyQuaternion(q: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(referenceAxis: any, rotationAxis: any, mtx: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function crossVectors(a: any, b: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(s: any): any;

    function divideScalar(scalar: any): any;

    function dot(v: any): any;

    function getSignedAngle(v: any, normal: any): any;

    function length(): any;

    function lengthSq(): any;

    function limitAngle(base: any, mtx: any, max: any): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiply(s: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function projectOnPlane(planeNormal: any): any;

    function projectOnVector(vector: any): any;

    function rotate(angle: any, axe: any): any;

    function set(x: any, y: any, z: any): any;

    function sign(v: any, normal: any): any;

    function zero(): any;

  }

  export namespace Y_NEG {
    const isVector3: boolean;

    const x: number;

    const y: number;

    const z: number;

    function abs(): any;

    function add(v: any): any;

    function angleTo(v: any): any;

    function applyM3(m: any): any;

    function applyMatrix3(m: any): any;

    function applyQuaternion(q: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(referenceAxis: any, rotationAxis: any, mtx: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function crossVectors(a: any, b: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(s: any): any;

    function divideScalar(scalar: any): any;

    function dot(v: any): any;

    function getSignedAngle(v: any, normal: any): any;

    function length(): any;

    function lengthSq(): any;

    function limitAngle(base: any, mtx: any, max: any): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiply(s: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function projectOnPlane(planeNormal: any): any;

    function projectOnVector(vector: any): any;

    function rotate(angle: any, axe: any): any;

    function set(x: any, y: any, z: any): any;

    function sign(v: any, normal: any): any;

    function zero(): any;

  }

  export namespace Z_AXE {
    const isVector3: boolean;

    const x: number;

    const y: number;

    const z: number;

    function abs(): any;

    function add(v: any): any;

    function angleTo(v: any): any;

    function applyM3(m: any): any;

    function applyMatrix3(m: any): any;

    function applyQuaternion(q: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(referenceAxis: any, rotationAxis: any, mtx: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function crossVectors(a: any, b: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(s: any): any;

    function divideScalar(scalar: any): any;

    function dot(v: any): any;

    function getSignedAngle(v: any, normal: any): any;

    function length(): any;

    function lengthSq(): any;

    function limitAngle(base: any, mtx: any, max: any): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiply(s: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function projectOnPlane(planeNormal: any): any;

    function projectOnVector(vector: any): any;

    function rotate(angle: any, axe: any): any;

    function set(x: any, y: any, z: any): any;

    function sign(v: any, normal: any): any;

    function zero(): any;

  }

  export namespace Z_NEG {
    const isVector3: boolean;

    const x: number;

    const y: number;

    const z: number;

    function abs(): any;

    function add(v: any): any;

    function angleTo(v: any): any;

    function applyM3(m: any): any;

    function applyMatrix3(m: any): any;

    function applyQuaternion(q: any): any;

    function approximatelyEquals(v: any, t: any): any;

    function clone(): any;

    function constrainedUV(referenceAxis: any, rotationAxis: any, mtx: any, min: any, max: any): any;

    function copy(v: any): any;

    function cross(v: any): any;

    function crossVectors(a: any, b: any): any;

    function distanceTo(v: any): any;

    function distanceToSquared(v: any): any;

    function divideBy(s: any): any;

    function divideScalar(scalar: any): any;

    function dot(v: any): any;

    function getSignedAngle(v: any, normal: any): any;

    function length(): any;

    function lengthSq(): any;

    function limitAngle(base: any, mtx: any, max: any): any;

    function min(v: any): any;

    function minus(v: any): any;

    function multiply(s: any): any;

    function multiplyScalar(scalar: any): any;

    function negate(): any;

    function negated(): any;

    function normalised(): any;

    function normalize(): any;

    function plus(v: any): any;

    function projectOnPlane(planeNormal: any): any;

    function projectOnVector(vector: any): any;

    function rotate(angle: any, axe: any): any;

    function set(x: any, y: any, z: any): any;

    function sign(v: any, normal: any): any;

    function zero(): any;

  }
}