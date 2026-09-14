precision mediump float;

uniform sampler2D colorRamp; // 256x1 LUT texture, see colorRamp.js

varying float vValue;
varying vec3 vNormal;

void main() {
  vec3 ramped = texture2D(colorRamp, vec2(clamp(vValue, 0.0, 1.0), 0.5)).rgb;

  // Cheap fixed-direction lighting so the extruded blocks read as 3D
  // volumes rather than flat color swatches.
  vec3 lightDir = normalize(vec3(0.4, 1.0, 0.6));
  float diffuse = max(dot(vNormal, lightDir), 0.0);
  vec3 shaded = ramped * (0.55 + 0.45 * diffuse);

  gl_FragColor = vec4(shaded, 1.0);
}
