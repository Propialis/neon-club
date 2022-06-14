/* eslint-disable arrow-parens */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
import metaversefile from 'metaversefile';
import * as THREE from 'three';
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
} from './audio/index.js';
import {
  neonClubCyberLinesFragment,
  neonClubCyberLinesVertex,
} from './shaders/neonClubCyberLines.js';
import {
  neonClubEmissiveFragmentShader,
  neonClubEmissiveVertexShader,
} from './shaders/neonEmissive.js';
import { sphereFragment, sphereVertex } from './shaders/sphere.js';

const { useApp, useLoaders, useFrame, useCleanup, usePhysics, useInternals } =
  metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');

const physicsIds = [];
let neonClubEmissiveMaterial;
let neonClubCyberLinesMaterial;
let cloudGeo;
let cloudMaterial1;
let cloudMaterial2;
let cloudMaterial3;
let cloudMaterial4;
let beatFactor1;
let beatFactor2;
let beatFactor3;
let beatFactor4;
let elapsedTime;

export default (e) => {
  const app = useApp();
  app.name = 'neon-club';
  // console.log(useInternals())

  // const rootScene = useInternals().rootScene
  // const camera = useInternals().camera
  // const composer = getComposer()
  const gl = useInternals().renderer;
  const physics = usePhysics();
  gl.outputEncoding = THREE.sRGBEncoding;
  // const disposeMaterial = (obj) => {
  //   if (obj.material) {
  //     obj.material.dispose()
  //   }
  // }
  // app.traverse(disposeMaterial)
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
  });
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
  });

  const loadModel = (params) => {
    return new Promise((resolve, reject) => {
      const { gltfLoader } = useLoaders();
      const { dracoLoader } = useLoaders();
      gltfLoader.setDRACOLoader(dracoLoader).setCrossOrigin('anonymous');

      gltfLoader.load(params.filePath + params.fileName, (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material.side = THREE.DoubleSide;
            // checking if the child is a wall
            if (
              child.material.name === 'Wall' ||
              child.material.name === 'Wall.001' ||
              child.material.name === 'Wall2'
            ) {
              const emissiveMap = new THREE.TextureLoader().load(
                baseUrl + 'textures/wall_Emissive.png'
              );
              const beatMap1 = new THREE.TextureLoader().load(
                baseUrl + 'textures/wall_Emissive rgb1.png'
              );
              const beatMap2 = new THREE.TextureLoader().load(
                baseUrl + 'textures/wall_Emissive rgb2.png'
              );
              emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;
              beatMap1.wrapS = beatMap1.wrapT = THREE.RepeatWrapping;
              beatMap2.wrapS = beatMap2.wrapT = THREE.RepeatWrapping;
              emissiveMap.flipY = false;
              beatMap1.flipY = false;
              beatMap2.flipY = false;
              neonClubCyberLinesMaterial.uniforms.uTexture.value = emissiveMap;
              neonClubCyberLinesMaterial.uniforms.uBeatMap1.value = beatMap1;
              neonClubCyberLinesMaterial.uniforms.uBeatMap2.value = beatMap2;
              child.material = neonClubCyberLinesMaterial;
              // child.layers.toggle(BLOOM_SCENE)
            }
            if (child.name === 'Cube133_2') {
              child.material = neonClubEmissiveMaterial;
              // child.layers.toggle(BLOOM_SCENE)
            }
            if (child.material.name === 'emasive') {
              child.material = neonClubEmissiveMaterial;
            }
          }
        });
        const physicsId = physics.addGeometry(gltf.scene);
        physicsIds.push(physicsId);
        // gltf.scene.position.set(0, 0, 0)
        // gltf.scene.rotation.set(Math.PI, 0, 0)
        // gltf.scene.updateMatrixWorld()
        resolve(gltf.scene);
      });
    });
  };

  const neonClubInfo = {
    fileName: 'neonclub_interior_V2_guilty.glb',
    filePath: baseUrl + 'models/',
  };
  const neonClub = loadModel(neonClubInfo);

  Promise.all([neonClub]).then((values) => {
    values.forEach((model) => {
      app.add(model);
    });
  });

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
  );
  sphere.position.set(-90, 12, 0);
  sphere.rotation.y = Math.PI;
  sphere.updateMatrixWorld();

  app.add(sphere);

  const directionalLight = new THREE.DirectionalLight('#283feb', 0.001);
  directionalLight.position.set(0, 0, 1);
  directionalLight.updateMatrixWorld();
  app.add(directionalLight);
  const orangeLight = new THREE.PointLight('#247cf0', 2, 100, 0.01);
  orangeLight.position.set(2, 3, 1);
  orangeLight.updateMatrixWorld();
  // app.add(orangeLight)
  const redLight = new THREE.PointLight('#f08624', 2, 100, 0.01);
  redLight.position.set(1, 3, 1);
  redLight.updateMatrixWorld();
  app.add(redLight);
  const blueLight = new THREE.PointLight('#3891f0', 0.1, 100, 0.01);
  blueLight.position.set(3, 3, 2);
  blueLight.updateMatrixWorld();
  app.add(blueLight);

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

  // creating audio with space bar click
  const audioTrackInformation = {
    source: 'https://res.cloudinary.com/musixdevelop/video/upload/track-audios/Sad.mp3',
    autoPlay: true,
    // currentTime: 100.2,
  };
  document.body.onkeyup = (e) => {
    if (e.code === 'Space') {
      const audio = getAudio({ createOnCall: false });
      if (audio.paused !== undefined) {
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      }
      createAudio(audioTrackInformation);
    }
  };

  const updateClouds = (array, rotation, beatFactor) => {
    array.forEach((cloud) => {
      if (beatFactor) {
        cloud.rotation.z *= 1 + beatFactor / 10000;
        cloud.position.y += Math.sin((elapsedTime * beatFactor) / 8000000);
      }
      cloud.rotation.z += rotation;
      cloud.updateMatrixWorld();
    });
  };

  useFrame(({ timestamp }) => {
    elapsedTime = timestamp;
    const threshold = getThreshold();
    updateMoodArray();
    logMood();
    if (neonClub) {
      neonClubEmissiveMaterial.uniforms.uTime.value = elapsedTime;
      neonClubCyberLinesMaterial.uniforms.uTime.value = elapsedTime;
      sphere.material.uniforms.uTime.value = elapsedTime * 10.0;

      const moodChanger = (threshold + 1) / 256;
      const moodChangerColor = [
        moodChanger + 0.1 + (beatFactor3 ? beatFactor3 / 50 : 0),
        0.3 + moodChanger / 10 + (beatFactor2 ? beatFactor2 / 40 : 0),
        Math.abs(0.8 - moodChanger) + (beatFactor1 ? beatFactor1 / 30 : 0),
      ];
      neonClubCyberLinesMaterial.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor
      );
      neonClubEmissiveMaterial.uniforms.uMood.value = new THREE.Vector3(
        ...moodChangerColor
      );
      if (beatFactor1) {
        cloudMaterial1.color = new THREE.Color(
          (moodChangerColor[0] + beatFactor1 / 30) / 5,
          (moodChangerColor[1] + beatFactor1 / 22) / 5,
          (moodChangerColor[2] + beatFactor1 / 30) / 5
        );
        neonClubEmissiveMaterial.uniforms.uBeat.value = beatFactor1;
        neonClubCyberLinesMaterial.uniforms.uBeat1.value = beatFactor1;
        neonClubCyberLinesMaterial.uniforms.uBeat2.value = beatFactor3;
        sphere.material.uniforms.uBeat.value = beatFactor3;
      }
      if (beatFactor2) {
        cloudMaterial2.color = new THREE.Color(
          (moodChangerColor[1] + beatFactor2 / 22) / 5,
          (moodChangerColor[0] + beatFactor2 / 30) / 5,
          (moodChangerColor[2] + beatFactor2 / 30) / 5
        );
      }
      if (beatFactor3) {
        cloudMaterial3.color = new THREE.Color(
          (moodChangerColor[0] - beatFactor3 / 30) / 5,
          (moodChangerColor[1] + beatFactor3 / 25) / 5,
          (moodChangerColor[2] + beatFactor3 / 30) / 5
        );
      }
      if (beatFactor4) {
        cloudMaterial4.color = new THREE.Color(
          (moodChangerColor[0] - beatFactor4 / 30) / 5,
          (moodChangerColor[1] + beatFactor4 / 24) / 5,
          (moodChangerColor[2] + beatFactor4 / 32) / 5
        );
      }
    }
    // shaking the scene with beat
    // earthquakePass.factor = beatFactor1 / 4

    beatFactor1 = getFrequenciesByRange({
      horizontalRangeStart: 208,
      horizontalRangeEnd: 216,
      verticalRangeStart: 45,
      verticalRangeEnd: 65,
    });
    beatFactor2 = getFrequenciesByRange({
      horizontalRangeStart: 85,
      horizontalRangeEnd: 93,
      verticalRangeStart: 50,
      verticalRangeEnd: 70,
    });
    beatFactor3 = getFrequenciesByRange({
      horizontalRangeStart: 100,
      horizontalRangeEnd: 108,
      verticalRangeStart: 150,
      verticalRangeEnd: 170,
    });
    beatFactor4 = getFrequenciesByRange({
      horizontalRangeStart: 140,
      horizontalRangeEnd: 148,
      verticalRangeStart: 80,
      verticalRangeEnd: 100,
    });

    // console.log(beatFactor3)
    // renderBloom(true)
  });
  useCleanup(() => {
    // composer.removePass(finalPass)
    // composer.removePass(earthquakePass)
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};