import * as THREE from 'three'

const neonClubCyberLinesVertex = `
    ${THREE.ShaderChunk.common}
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform float uTime;

    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
    void main() {
      vUv = uv;
      vec3 newPosition = position;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition;
      ${THREE.ShaderChunk.logdepthbuf_vertex}
    }
  `

const neonClubCyberLinesFragment = `
  precision highp float;
  precision highp int;
  #define PI 3.1415926535897932384626433832795
  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec3 uMood;
  uniform sampler2D uTexture;
  uniform sampler2D uBeatMap1;
  uniform sampler2D uBeatMap2;
  uniform float uTime;
  uniform float uBeat1;
  uniform float uBeat2;

  #define tau PI * 2.0

  float circ(vec2 p) {
    float r = length(p);
    r = log(sqrt(r));
    return abs(mod(r * 4., tau) - 3.14) * 3. + .2;
  
  }
  
  void main() {
    float time = uTime/450.;
    vec2 uv = vUv;
    // uv *= 2.;
    vec4 texture1 = vec4(texture2D(uTexture, uv));
    vec4 texture2 = vec4(texture2D(uBeatMap1, uv));
    vec4 texture3 = vec4(texture2D(uBeatMap2, uv));
    vec2 p = vec2(vUv.x - 0.5, vUv.y - 0.5);

    float rz = vUv.x + 1.;
  
    //rings
    p /= exp(mod(time, PI));
    rz /= pow(abs((0.6 - circ(p))), .5);
    rz *= 2.0;
    vec3 moodColor = uMood;
    vec3 col = moodColor * rz;
    vec3 revCol = (1. - texture1.a) * (1. - rz) * col * sin(time + clamp(uBeat2,0.0,5.0));
    col *= texture1.a;
    col += revCol;
    gl_FragColor = vec4(col , 1.) ;
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`

export { neonClubCyberLinesVertex, neonClubCyberLinesFragment }