// github Version//
/* eslint-disable arrow-parens */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
import metaversefile from 'metaversefile'
import * as THREE from 'three'
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
// import { BlendShader } from 'three/examples/jsm/shaders/BlendShader.js'
// import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js'
// import { getComposer } from '../../renderer.js'
// import { Earthquake } from './passes/Earthquake.js'
import {
  createAudio,
  getAudio,
  getFrequenciesByRange,
  getThreshold,
  logMood,
  updateMoodArray,
} from './audio/index.js'
import {
  neonClubCyberLinesFragment,
  neonClubCyberLinesVertex,
} from './shaders/neonClubCyberLines.js'
import {
  neonClubEmissiveFragmentShader,
  neonClubEmissiveVertexShader,
} from './shaders/neonEmissive.js'
import {
  neonParticlesFragmentShader,
  neonParticlesVertexShader,
} from './shaders/neonParticles.js'
import {
  masterPieceParticlesFragment,
  masterPieceParticlesVertex,
} from './shaders/masterPieceParticles.js'

const { useApp, useLoaders, useFrame, useCleanup, usePhysics, useInternals } =
  metaversefile

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1')

let physicsIds = []
let emasiveArray = []
let neonClubEmissiveMaterial
let neonClubCyberLinesMaterial
let cloudGeo
let cloudMaterial1
let cloudMaterial2
let cloudMaterial3
let cloudMaterial4
let cloudParticles1 = []
let cloudParticles2 = []
let cloudParticles3 = []
let cloudParticles4 = []
let beatFactor1
let beatFactor2
let beatFactor3
let beatFactor4
let elapsedTime
let beatSpeakerHi
let beatSpeakerBass
let reactWoofer
let reactMid

//faeries
let pulseAnimation = false
let pulseNumber = 1
let pulseNumber2 = 1

export default (e) => {
  const app = useApp()
  app.name = 'neon-club'
  let speakers = [];
  // const rootScene = useInternals().rootScene
  const camera = useInternals().camera //faeries
  // const composer = getComposer()
  const gl = useInternals().renderer
  const physics = usePhysics()
  gl.outputEncoding = THREE.sRGBEncoding
  neonClubEmissiveMaterial = new THREE.ShaderMaterial({
    vertexShader: neonClubEmissiveVertexShader,
    fragmentShader: neonClubEmissiveFragmentShader,
    vertexColors: true,
    // transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uMood: { value: new THREE.Vector3(0.3, 0.5, 1) },
      uBeat: { value: 0 },
      uTexture: { value: null },
    },
  })
  neonClubCyberLinesMaterial = new THREE.ShaderMaterial({
    vertexShader: neonClubCyberLinesVertex,
    fragmentShader: neonClubCyberLinesFragment,
    vertexColors: true,
    // wireframe:true,
    // transparent: true,
    // side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBeat1: { value: 0 },
      uBeat2: { value: 0 },
      uMood: { value: new THREE.Vector3(1, 0, 0) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      uBeatMap1: { value: null },
      uBeatMap2: { value: null },
    },
  })

  ///faeries
  const disposeMaterial = (obj) => {
    if (obj.material) {
      obj.material.dispose()
    }
  }







  const loadModel = (params) => {
    return new Promise((resolve, reject) => {
      const { gltfLoader } = useLoaders()
      const { dracoLoader } = useLoaders()
      gltfLoader.setDRACOLoader(dracoLoader).setCrossOrigin('anonymous')

      gltfLoader.load(params.filePath + params.fileName, (gltf) => {
        console.log(gltf);
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material.side = THREE.DoubleSide
            // checking if the child is a wall
            if (
              child.material.name === 'Wall' ||
              child.material.name === 'Wall.001' ||
              child.material.name === 'Wall2'
            ) {
              const emissiveMap = new THREE.TextureLoader().load(
                baseUrl + 'textures/wall_Emissive.png'
              )
              const beatMap1 = new THREE.TextureLoader().load(
                baseUrl + 'textures/wall_Emissive rgb1.png'
              )
              const beatMap2 = new THREE.TextureLoader().load(
                baseUrl + 'textures/wall_Emissive rgb2.png'
              )
              emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping
              beatMap1.wrapS = beatMap1.wrapT = THREE.RepeatWrapping
              beatMap2.wrapS = beatMap2.wrapT = THREE.RepeatWrapping
              emissiveMap.flipY = false
              beatMap1.flipY = false
              beatMap2.flipY = false
              neonClubCyberLinesMaterial.uniforms.uTexture.value = emissiveMap
              neonClubCyberLinesMaterial.uniforms.uBeatMap1.value = beatMap1
              neonClubCyberLinesMaterial.uniforms.uBeatMap2.value = beatMap2
              child.material = neonClubCyberLinesMaterial
              // child.layers.toggle(BLOOM_SCENE)
            }
            if (child.name === 'Cube133_2') {
              child.material = neonClubEmissiveMaterial
              // child.layers.toggle(BLOOM_SCENE)
            }
            if (child.material.name === 'emasive') {
              emasiveArray.push(child)
            }
            emasiveArray.forEach((child) => {
              child.material = neonClubEmissiveMaterial
              // child.layers.toggle(BLOOM_SCENE)
            })

            // methods for preparing speakers and their locations
            if (child.name === 'Speaker_1'){
              let speaker1 = new THREE.Object3D();
              gltf.scene.scale.set(4,4,4);
              //works with hardcoded values
              gltf.scene.position.copy(params.speakerPos);
              gltf.scene.quaternion.copy(params.speakerQuat);
              speaker1 = gltf;
              speakers.push(speaker1);
            }
          }
        })
        const physicsId = physics.addGeometry(gltf.scene)
        physicsIds.push(physicsId)
        resolve(gltf.scene)
      })
    })
  }
  
  // for loading club
  const neonClubInfo = {
    fileName: 'neonclub.glb',
    filePath: baseUrl + 'models/',
  }
  const neonClub = loadModel(neonClubInfo);
  Promise.all([neonClub]).then((values) => {
    values.forEach((model) => {
      app.add(model)
    })
  })

  // for loadng speakers
  const speaker1Info = {
    fileName: 'react-Speaker.glb',
    filePath: baseUrl + 'models/',
    speakerPos: new THREE.Vector3(45,5,43),
    speakerQuat: new THREE.Vector4(0,1,0,0),
  }
  const vizSpeaker1 = loadModel(speaker1Info);
  Promise.all([vizSpeaker1]).then((values) => {
    values.forEach((model) => {
      console.log("loaded speaker");
      app.add(model)
      console.log(model);
    })
  })
  const speakerInfo2 = {
    fileName: 'react-Speaker.glb',
    filePath: baseUrl + 'models/',
    speakerPos: new THREE.Vector3(83,5,43),
    speakerQuat: new THREE.Vector4(0,1,0,0),
  }
  const vizSpeaker2 = loadModel(speakerInfo2);
  Promise.all([vizSpeaker2]).then((values) => {
    values.forEach((model) => {
      app.add(model)
    })
  })

  //^ Refactor

  const masterPiece = new THREE.Points(
    new THREE.PlaneBufferGeometry(5, 5, 60, 60),
    new THREE.ShaderMaterial({
      vertexShader: masterPieceParticlesVertex,
      fragmentShader: masterPieceParticlesFragment,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      // wireframe:true,
      transparent: true,
      // side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 0.5 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uTexture: { value: null },
        uSize: { value: 18 * gl.getPixelRatio() },
      },
    })
  )
  masterPiece.position.set(0, 33, 146.5)
  masterPiece.rotation.x = Math.PI / 2
  masterPiece.updateMatrixWorld()
  // app.add(masterPiece)

  const neonParticles = new THREE.Points(
    new THREE.TorusKnotBufferGeometry(100, 20, 140, 140),
    new THREE.ShaderMaterial({
      vertexShader: neonParticlesVertexShader,
      fragmentShader: neonParticlesFragmentShader,
      // depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      // wireframe:true,
      transparent: true,
      // side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uBeat: { value: 0.5 },
        uResolution: { value: new THREE.Vector2() },
        uTexture: { value: null },
        uSize: { value: 8 * gl.getPixelRatio() },
      },
    })
  )

  new THREE.TextureLoader().load(
    'https://res.cloudinary.com/dqakam2xt/image/upload/v1618858417/large_vtj9je.jpg',
    (texture) => {
      neonParticles.material.uniforms.uTexture.value = texture
    }
  )
  // neonParticles.scale.set(1, 1, 1)
  neonParticles.position.set(0, 140, 145)

  app.add(neonParticles)

  new THREE.TextureLoader().load(baseUrl + 'textures/smoke.png', (texture) => {
    cloudGeo = new THREE.PlaneBufferGeometry(100, 100)
    cloudMaterial1 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    cloudMaterial2 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    cloudMaterial3 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    cloudMaterial4 = new THREE.MeshLambertMaterial({
      map: texture,
      transparent: true,
      // side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: '#535d6a',
    })
    const addClouds = (pos, material, array) => {
      for (let p = 0; p < 20; p++) {
        const cloud = new THREE.Mesh(cloudGeo, material)
        cloud.position.set(Math.random() * 2 - 1, 12.5, Math.random() * 2 - 2)
        cloud.position.x += pos[0]
        cloud.position.y += pos[1]
        cloud.position.z += pos[2]
        cloud.rotation.y += Math.PI
        // cloud.rotation.y = -0.12
        // cloud.rotation.x = 1.16
        cloud.rotation.z = Math.random() * 2 * Math.PI
        cloud.material.opacity = 0.2
        array.push(cloud)
        cloud.updateMatrixWorld()
        // cloud.layers.toggle(BLOOM_SCENE)
        app.add(cloud)
      }
    }
    addClouds([20, -23, 42], cloudMaterial1, cloudParticles1)
    addClouds([-20, -29, 40], cloudMaterial2, cloudParticles2)
    addClouds([40, -20, 45], cloudMaterial3, cloudParticles3)
    addClouds([-50, -25, 34], cloudMaterial4, cloudParticles4)
  })

  const directionalLight = new THREE.DirectionalLight('#283feb', 0.01)
  directionalLight.position.set(0, 0, 1)
  directionalLight.updateMatrixWorld()
  app.add(directionalLight)
  const orangeLight = new THREE.PointLight('#247cf0', 2, 100, 0.1)
  orangeLight.position.set(2, 3, 1)
  orangeLight.updateMatrixWorld()
  app.add(orangeLight)
  const redLight = new THREE.PointLight('#f08624', 2, 100, 0.1)
  redLight.position.set(1, 3, 1)
  redLight.updateMatrixWorld()
  app.add(redLight)
  const blueLight = new THREE.PointLight('#3891f0', 2, 100, 0.1)
  blueLight.position.set(3, 3, 2)
  blueLight.updateMatrixWorld()
  app.add(blueLight)

  // effects
  // const renderScene = composer.passes[0]
  // const bloomPass = new UnrealBloomPass(
  //   new THREE.Vector2(window.innerWidth, window.innerHeight),
  //   1.2,
  //   0.3,
  //   0.5
  // )
  // const bloomComposer = new EffectComposer(gl)
  // bloomComposer.renderToScreen = false
  // console.log(composer)
  // bloomComposer.addPass(renderScene)
  // bloomComposer.addPass(bloomPass)
  // const finalPass = new ShaderPass(
  //   new THREE.ShaderMaterial({
  //     uniforms: {
  //       baseTexture: { value: null },
  //       bloomTexture: { value: bloomComposer.renderTarget2.texture },
  //     },
  //     vertexShader: `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}
  //     `,
  //     fragmentShader: `
  //     uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main() { gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );}
  //     `,
  //   }),
  //   'baseTexture'
  // )
  // composer.addPass(finalPass)
  // const earthquakePass = new Earthquake()
  // composer.addPass(earthquakePass)

  // selective bloom

  // const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' })
  // const materials = {}
  // const ENTIRE_SCENE = 0
  // const BLOOM_SCENE = 1
  // const bloomLayer = new THREE.Layers()
  // bloomLayer.set(BLOOM_SCENE)
  // neonParticles.layers.toggle(BLOOM_SCENE)
  // const darkenNonBloomed = (obj) => {
  //   if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
  //     materials[obj.uuid] = obj.material
  //     obj.material = darkMaterial
  //   }
  // }
  // const restoreMaterial = (obj) => {
  //   if (materials[obj.uuid]) {
  //     obj.material = materials[obj.uuid]
  //     delete materials[obj.uuid]
  //   }
  // }

  // const renderBloom = (mask) => {
  //   if (mask === true) {
  //     app.traverse(darkenNonBloomed)
  //     bloomComposer.render()
  //     app.traverse(restoreMaterial)
  //   } else {
  //     camera.layers.set(BLOOM_SCENE)
  //     bloomComposer.render()
  //     camera.layers.set(ENTIRE_SCENE)
  //   }
  // }
  //faeries
  const faerieMasterpieceGeometry = new THREE.BoxBufferGeometry(6, 6, 6, 5, 5, 5)
  const faerieMasterpieceMaterial = new THREE.ShaderMaterial({
    vertexShader: faerieMasterpieceParticlesVertex,
    fragmentShader: faerieMasterpieceParticlesFragment,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    transparent: true,
    // side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(1, 2, 1) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      uSize: { value: 9 * gl.getPixelRatio() },
    },
  })

  const faerieMasterpiece = new THREE.Points(faerieMasterpieceGeometry, faerieMasterpieceMaterial)
  // const wireframe = new THREE.LineSegments(
  //   faerieMasterpieceGeometry,
  //   faerieMasterpieceMaterial
  // )
  // faerieMasterpiece.add(wireframe)
  faerieMasterpiece.scale.set(0.99, 0.99, 0.99)
  faerieMasterpiece.position.set(0, 1, 0)
  faerieMasterpiece.rotation.x = Math.PI / 2
  faerieMasterpiece.updateMatrixWorld()

  app.add(faerieMasterpiece)

  // const roomGeometry = new THREE.BoxBufferGeometry(30, 5, 5, 100, 100, 100)
  const roomGeometry = new THREE.PlaneBufferGeometry(6, 6, 500, 500)
  const roomWireframeGeometry = new THREE.BoxBufferGeometry(
    30,
    7,
    7,
    20,
    20,
    20
  )
  const roomMaterial = new THREE.ShaderMaterial({
    vertexShader: roomVertex,
    fragmentShader: roomFragment,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    // transparent: true,
    // side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uPulse: { value: -2 },
      uPulse2: { value: -2 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })
  const roomWireframeMaterial = new THREE.ShaderMaterial({
    vertexShader: roomVertex,
    fragmentShader: roomWireframeFragment,
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    // wireframe:true,
    transparent: true,
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uBeat: { value: 0.5 },
      uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture: { value: null },
      // uSize: { value: 4 * gl.getPixelRatio() },
    },
  })

  const room = new THREE.Mesh(roomGeometry, roomMaterial)

  // room.rotation.z += Math.PI / 2
  // room.rotation.x += Math.PI / 4
  // room.rotation.y += Math.PI / 4
  room.position.set(0, 2.5, -3)
  room.updateMatrixWorld()
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial()
  )
  ground.rotation.x -= Math.PI / 2
  ground.position.y -= 1
  // const groundPhysicsId = physics.addGeometry(ground)
  // physicsIds.push(groundPhysicsId)
  const wireframe = new THREE.LineSegments(
    roomWireframeGeometry,
    roomWireframeMaterial
  )
  // wireframe.scale.set(0.999, 0.999, 0.999)
  wireframe.position.set(0, 2.5, 0)
  wireframe.updateMatrixWorld()
  // room.add(wireframe)
  // app.add(room)

  const sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(2.5, 1000, 1000),
    new THREE.ShaderMaterial({
      vertexShader: sphereVertex,
      fragmentShader: sphereFragment,
      // depthWrite: false,
      // blending: THREE.AdditiveBlending,
      vertexColors: true,
      // wireframe:true,
      // transparent: true,
      // side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: -2 },
        uPulse2: { value: -2 },
        uBeat: { value: 0.5 },
        uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uTexture: { value: null },
        // uSize: { value: 4 * gl.getPixelRatio() },
      },
    })
  )
  sphere.position.set(1, 2, 20)
  sphere.rotation.y = Math.PI
  sphere.updateMatrixWorld()

/////

//faeries  curls
 // curve
 function computeCurl(x, y, z) {
  var eps = 0.0001

  var curl = new THREE.Vector3()

  //Find rate of change in YZ plane
  var n1 = simplex3D(x, y + eps, z)
  var n2 = simplex3D(x, y - eps, z)
  //Average to find approximate derivative
  var a = (n1 - n2) / (2 * eps)
  var n1 = simplex3D(x, y, z + eps)
  var n2 = simplex3D(x, y, z - eps)
  //Average to find approximate derivative
  var b = (n1 - n2) / (2 * eps)
  curl.x = a - b

  //Find rate of change in XZ plane
  n1 = simplex3D(x, y, z + eps)
  n2 = simplex3D(x, y, z - eps)
  a = (n1 - n2) / (2 * eps)
  n1 = simplex3D(x + eps, y, z)
  n2 = simplex3D(x - eps, y, z)
  b = (n1 - n2) / (2 * eps)
  curl.y = a - b

  //Find rate of change in XY plane
  n1 = simplex3D(x + eps, y, z)
  n2 = simplex3D(x - eps, y, z)
  a = (n1 - n2) / (2 * eps)
  n1 = simplex3D(x, y + eps, z)
  n2 = simplex3D(x, y - eps, z)
  b = (n1 - n2) / (2 * eps)
  curl.z = a - b

  return curl
}

const getCurve = (start) => {
  const points = []
  points.push(start)
  const currentPoint = start.clone()
  for (let i = 0; i < 50; i++) {
    const v = computeCurl(currentPoint.x, currentPoint.y, currentPoint.z)
    currentPoint.addScaledVector(v, 0.001)
    points.push(currentPoint.clone())
  }
  return points
}

/////



// curve mats
const curveMat = new THREE.ShaderMaterial({
  vertexShader: sphereVertex,
  fragmentShader: sphereFragment,
  // depthWrite: false,
  // blending: THREE.AdditiveBlending,
  vertexColors: true,
  // wireframe:true,
  // transparent: true,
  // side: THREE.BackSide,
  uniforms: {
    uTime: { value: 0 },
    uPulse: { value: -2 },
    uPulse2: { value: -2 },
    uBeat: { value: 0.5 },
    uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTexture: { value: null },
    // uSize: { value: 4 * gl.getPixelRatio() },
  },
})
const curveMat1 = new THREE.ShaderMaterial({
  vertexShader: sphereVertex,
  fragmentShader: sphereFragment1,
  // depthWrite: false,
  // blending: THREE.AdditiveBlending,
  vertexColors: true,
  // wireframe:true,
  // transparent: true,
  // side: THREE.BackSide,
  uniforms: {
    uTime: { value: 0 },
    uPulse: { value: -2 },
    uPulse2: { value: -2 },
    uBeat: { value: 0.5 },
    uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTexture: { value: null },
    // uSize: { value: 4 * gl.getPixelRatio() },
  },
})
const curveMat2 = new THREE.ShaderMaterial({
  vertexShader: sphereVertex,
  fragmentShader: sphereFragment2,
  // depthWrite: false,
  // blending: THREE.AdditiveBlending,
  vertexColors: true,
  // wireframe:true,
  // transparent: true,
  // side: THREE.BackSide,
  uniforms: {
    uTime: { value: 0 },
    uPulse: { value: -2 },
    uPulse2: { value: -2 },
    uBeat: { value: 0.5 },
    uMood: { value: new THREE.Vector3(0.1, 0.2, 0.6) },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTexture: { value: null },
    // uSize: { value: 4 * gl.getPixelRatio() },
  },
})


// Curves
for (let i = 0; i < 100; i++) {
  const path = new THREE.CatmullRomCurve3(
    getCurve(
      new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )
    )
  )
  const curveGeo = new THREE.TubeBufferGeometry(path, 50, 0.002, 8, false)
  const curve = new THREE.Mesh(curveGeo, curveMat)
  curve.scale.set(2, 96, 96)
  curve.rotation.z = Math.PI/2
  curve.updateMatrixWorld()
  app.add(curve)
}
for (let i = 0; i < 200; i++) {
  const path = new THREE.CatmullRomCurve3(
    getCurve(
      new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )
    )
  )
  const curveGeo = new THREE.TubeBufferGeometry(path, 50, 0.001, 8, false)
  const curve = new THREE.Mesh(curveGeo, curveMat1)
  curve.scale.set(2, 120, 120)
  curve.rotation.z = Math.PI/2
  curve.updateMatrixWorld()
  app.add(curve)
}
for (let i = 0; i < 100; i++) {
  const path = new THREE.CatmullRomCurve3(
    getCurve(
      new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )
    )
  )
  const curveGeo = new THREE.TubeBufferGeometry(path, 50, 0.001, 8, false)
  const curve = new THREE.Mesh(curveGeo, curveMat2)
  curve.scale.set(2, 84, 84)
  curve.rotation.z = Math.PI/2
  curve.updateMatrixWorld()
  app.add(curve)
}
//////


































  // creating audio with space bar click
  const audioTrackInformation = {
    source: 'https://res.cloudinary.com/musixdevelop/video/upload/track-audios/Sad.mp3',
    autoPlay: true,
    // currentTime: 100.2,
  }

  // play the ^above audio or pause it
  document.body.onkeyup = (e) => {
    if (e.code === 'Digit1') {
      const audio = getAudio({ createOnCall: false })
      console.log("m pressed"), audio;
      if (audio.paused !== undefined) {
        if (audio.paused) {
          audio.play()
        } else {
          audio.pause()
          console.log("paused");
        }
      }
      createAudio(audioTrackInformation)
    }
  }



  const updateClouds = (array, rotation, beatFactor) => {
    array.forEach((cloud) => {
      if (beatFactor) {
        cloud.rotation.z *= 1 + beatFactor / 10000
        cloud.position.y += Math.sin((elapsedTime * beatFactor) / 8000000)
      }
      cloud.rotation.z += rotation
      cloud.updateMatrixWorld()
    })
  }

  useFrame(({ timestamp }) => {
    if (neonParticles) {
      if (beatFactor1) {
        // neonParticles.rotation.z -= 0.001 * beatFactor1
        neonParticles.rotation.y -= 0.0005 * beatFactor1
        neonParticles.rotation.x -= 0.0005 * beatFactor1
        neonParticles.position.y -= 0.05 * beatFactor1
      }
      // neonParticles.rotation.z -= 0.001
      neonParticles.rotation.y -= 0.0001
      neonParticles.rotation.x -= 0.0001
      if (neonParticles.position.y > 50) {
        neonParticles.position.y -= 0.5
      } else {
        neonParticles.position.y = 160
      }
      neonParticles.updateMatrixWorld()
    }

    elapsedTime = timestamp
    const threshold = getThreshold()
    updateMoodArray()
    logMood()

    //faeries
    faerieMasterpiece.material.uniforms.uTime.value = elapsedTime
    room.material.uniforms.uTime.value = elapsedTime * 10
    sphere.material.uniforms.uTime.value = elapsedTime * 10
    curveMat.uniforms.uTime.value = elapsedTime
    curveMat1.uniforms.uTime.value = elapsedTime
    curveMat2.uniforms.uTime.value = elapsedTime

    wireframe.material.uniforms.uTime.value = elapsedTime
    if (pulseAnimation) {
      if (pulseNumber >= 2) {
        pulseNumber = 1
        pulseNumber2 = 1
        pulseAnimation = false
      } else {
        pulseNumber += beatFactor3 / 100
        pulseNumber2 += beatFactor3 / 100
        room.material.uniforms.uPulse.value = pulseNumber
        room.material.uniforms.uPulse2.value = pulseNumber2
      }
    }
//////






    
    if (neonClub) {
      neonParticles.material.uniforms.uTime.value = elapsedTime
      neonClubEmissiveMaterial.uniforms.uTime.value = elapsedTime
      neonClubCyberLinesMaterial.uniforms.uTime.value = elapsedTime

      const moodChanger = (threshold + 1) / 256
      const moodChangerColor = [
        moodChanger + 0.1 + (beatFactor3 ? beatFactor3 / 50 : 0),
        0.3 + moodChanger / 10 + (beatFactor2 ? beatFactor2 / 40 : 0),
        Math.abs(0.8 - moodChanger) + (beatFactor1 ? beatFactor1 / 30 : 0),
      ]
      // match the wall lines with to the music base on above
      neonClubCyberLinesMaterial.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor
      )
      // match the outside emissive sections with the music based on above
      neonClubEmissiveMaterial.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor
      )
      // whenever there is a high match the cloud to a colour based R~3+1, G~2+1, B~1+1
      if (beatFactor1) {
        cloudMaterial1.color = new THREE.Color(
          (moodChangerColor[0] + beatFactor1 / 30) / 5,
          (moodChangerColor[1] + beatFactor1 / 22) / 5,
          (moodChangerColor[2] + beatFactor1 / 30) / 5
        )
        neonParticles.material.uniforms.uBeat.value = beatFactor1
        neonClubEmissiveMaterial.uniforms.uBeat.value = beatFactor1
        neonClubCyberLinesMaterial.uniforms.uBeat1.value = beatFactor1
        neonClubCyberLinesMaterial.uniforms.uBeat2.value = beatFactor3


        ///faeries
        room.material.uniforms.uBeat.value = beatFactor1
        sphere.material.uniforms.uBeat.value = beatFactor1
        faerieMasterpiece.material.uniforms.uBeat.value = beatFactor1
        curveMat.uniforms.uBeat.value += beatFactor1

        faerieMasterpiece.updateMatrixWorld()
      }
      if (beatFactor2) {
        cloudMaterial2.color = new THREE.Color(
          (moodChangerColor[1] + beatFactor2 / 22) / 5,
          (moodChangerColor[0] + beatFactor2 / 30) / 5,
          (moodChangerColor[2] + beatFactor2 / 30) / 5
        )
        //faeries 
        curveMat2.uniforms.uBeat.value += beatFactor2
      }
      if (beatFactor3) {
        cloudMaterial3.color = new THREE.Color(
          (moodChangerColor[0] - beatFactor3 / 30) / 5,
          (moodChangerColor[1] + beatFactor3 / 25) / 5,
          (moodChangerColor[2] + beatFactor3 / 30) / 5
        )
        ///faeries
        if (beatFactor3 >= 0.88) {
          curveMat1.uniforms.uBeat.value += beatFactor3
          pulseAnimation = true
        }
      }
      if (beatFactor4) {
        cloudMaterial4.color = new THREE.Color(
          (moodChangerColor[0] - beatFactor4 / 30) / 5,
          (moodChangerColor[1] + beatFactor4 / 24) / 5,
          (moodChangerColor[2] + beatFactor4 / 32) / 5
        )
      }

      updateClouds(cloudParticles1, -0.00035, beatFactor1)
      updateClouds(cloudParticles2, 0.0004, beatFactor2)
      updateClouds(cloudParticles3, 0.00025, beatFactor3)
      updateClouds(cloudParticles4, -0.0003, beatFactor4)
      // console.log(beatFactor1);
      // directionalLight.color = new THREE.Color(...moodChangerColor)
      // console.log(moodChanger)
    }
    // shaking the scene with beat
    // earthquakePass.factor = beatFactor1 / 4


    // deforming speakers to the music
    if (beatSpeakerHi){
      reactMid = beatSpeakerHi;
      // console.log(reactWoofer);
    };
    if (beatSpeakerBass){
      reactWoofer = beatSpeakerBass;
      // console.log(reactMid);
    };
    //console.log(speaker.scene.isMesh());
    if (speakers){
      speakers.forEach(speaker => {
        speaker.scene.traverse(o => {
          if (o.isMesh) {
            o.morphTargetInfluences[0] = reactWoofer;
            o.morphTargetInfluences[1] = reactMid;
          }
        })
      });

  }







    //SpeakerFactors
    beatSpeakerHi = getFrequenciesByRange({
      horizontalRangeStart: 80,
      horizontalRangeEnd: 108,
      verticalRangeStart: 140,
      verticalRangeEnd: 170,
    });
    beatSpeakerBass = getFrequenciesByRange({
      horizontalRangeStart: 30,
      horizontalRangeEnd: 50,
      verticalRangeStart: 60,
      verticalRangeEnd: 140,
    });

    // getting the audio output in the given frequencies
    //high
    beatFactor1 = getFrequenciesByRange({
      horizontalRangeStart: 208,
      horizontalRangeEnd: 216,
      verticalRangeStart: 45,
      verticalRangeEnd: 65,
    })
    //low
    beatFactor2 = getFrequenciesByRange({
      horizontalRangeStart: 85,
      horizontalRangeEnd: 93,
      verticalRangeStart: 50,
      verticalRangeEnd: 70,
    })
    // mid low
    beatFactor3 = getFrequenciesByRange({
      horizontalRangeStart: 100,
      horizontalRangeEnd: 108,
      verticalRangeStart: 150,
      verticalRangeEnd: 170,
    })
    // mid high
    beatFactor4 = getFrequenciesByRange({
      horizontalRangeStart: 140,
      horizontalRangeEnd: 148,
      verticalRangeStart: 80,
      verticalRangeEnd: 100,
    })

    // console.log(beatFactor3)
    // renderBloom(true)
  })
  useCleanup(() => {
    // composer.removePass(finalPass)
    // composer.removePass(earthquakePass)
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId)
    }
  })

  return app
}
