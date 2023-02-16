uniform float time;
uniform float progress;
uniform float speed;
uniform float dir;
uniform sampler2D uTexture;
uniform sampler2D uDisplace;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.141592653589793238;
void main() {
    vec4 d = texture2D(uDisplace,(vUv - vec2(0.5))*(1. + speed) + vec2(0.5));
    float force = pow(length(vUv.x) + 0.5,abs(speed*0.1));
    vec2 newuv = vUv*cos(1.-force);

    gl_FragColor = (0.1 + 3. * speed)*texture2D(uTexture,newuv + d.xy * 0.001 + vec2(0.,-0.01));
}