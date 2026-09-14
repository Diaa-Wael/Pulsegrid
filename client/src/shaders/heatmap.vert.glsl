// Per-instance sensor value in [0, 1], written directly into an
// InstancedBufferAttribute by CityMesh.js every time new data arrives.
attribute float value;

varying float vValue;
varying vec3 vNormal;

void main() {
  vValue = value;
  vNormal = normalize(normalMatrix * normal);

  // instanceMatrix is provided automatically by Three.js for InstancedMesh
  vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
}
