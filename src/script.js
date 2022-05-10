import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";
// for physics
// old cannon library
// import CANNON from "cannon";
// new cannon-es library
import * as CANNON from "cannon-es";

/**
 * Debug
 */
const gui = new dat.GUI();
// Button for creating random spheres \\
// obj for holding the necessary params
const debugObject = {};
debugObject.createSphere = () => {
  createSphere(Math.random() * 0.5, {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};

// Button for creating random cubes \\
debugObject.createCube = () => {
  createCube(Math.random() * 0.5, {
    x: (Math.random() - 0.5) * 5,
    y: 3,
    z: (Math.random() - 0.5) * 5,
  });
};

// for reseting the scene
debugObject.reset = () => {
  objectsToUpdate.forEach((object) => {
    // Remove body
    object.body.removeEventListener("collide", playHitSound);
    world.removeBody(object.body);
    // Remove mesh
    scene.remove(object.mesh);
  });
};

gui.add(debugObject, "createSphere");
gui.add(debugObject, "createCube");
gui.add(debugObject, "reset");

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Sounds
 */
const hitSound = new Audio("/sounds/hit.mp3");

const playHitSound = (collision) => {
  // to get info about the collisions
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();
  if (impactStrength > 1.5) {
    // for random sounds for each obj
    hitSound.volume = Math.random() * (impactStrength / 10);
    // to replay the sound on each collision
    hitSound.currentTime = 0;
    // to play the sound
    hitSound.play();
  }
};

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.png",
  "/textures/environmentMaps/0/nx.png",
  "/textures/environmentMaps/0/py.png",
  "/textures/environmentMaps/0/ny.png",
  "/textures/environmentMaps/0/pz.png",
  "/textures/environmentMaps/0/nz.png",
]);

/**
 * PHYSICS
 */
// Whole World \\
// create physics world
const world = new CANNON.World();
// change from default NaiveBroadphase to SAPBroadphase for optimized collision detection functionality
world.broadphase = new CANNON.SAPBroadphase(world);
// allow slow moving obj not to be tested
world.allowSleep = true;
// add gravity
world.gravity.set(0, -9.82, 0);

// Materials \\
// different materials for each body
// for floor
// const concreteMaterial = new CANNON.Material("concrete")
// // for sphere
// const plasticMaterial = new CANNON.Material("plastic")
// const concretePlasticContactMaterial = new CANNON.ContactMaterial(
//   concreteMaterial,
//   plasticMaterial,
//   {
//     friction: 0.1,
//     restitution: 0.7
//   }
// )
// world.addContactMaterial(concretePlasticContactMaterial)

// single default material for all Bodies
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.7,
  }
);
world.addContactMaterial(defaultContactMaterial);
// setting default material on the world itself
world.defaultContactMaterial = defaultContactMaterial;

// Sphere \\
// // create shape instance
// const sphereShape = new CANNON.Sphere(0.5);
// // actual shape body
// const sphereBody = new CANNON.Body({
//   mass: 1,
//   position: new CANNON.Vec3(0, 3, 0),
//   shape: sphereShape,
//   // setting materials (no
//   // material: plasticMaterial
//   // material: defaultMaterial
// });
// // adding force on the sphere to push it in the given direction
// sphereBody.applyLocalForce(
//   new CANNON.Vec3(100, 0, 0),
//   new CANNON.Vec3(0, 0, 0)
// );

// // adding body to the World
// world.addBody(sphereBody);

// Floor \\
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
// setting materials (not necessary as it was set to the world directly)
// floorBody.material = concreteMaterial
// floorBody.material = defaultMaterial
// assigning vals after the instantiation
floorBody.mass = 0;
// no need for position as it's already in the center and we add a new shape for the body
floorBody.addShape(floorShape);
// We can add many shapes to 1 body
// floorBody.addShape(floorShape);
// floorBody.addShape(floorShape);
// rotating the floor on the physical world
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

/**
 * Test sphere
 */
// const sphere = new THREE.Mesh(
//   new THREE.SphereGeometry(0.5, 32, 32),
//   new THREE.MeshStandardMaterial({
//     metalness: 0.3,
//     roughness: 0.4,
//     envMap: environmentMapTexture,
//     envMapIntensity: 0.5,
//   })
// );
// sphere.castShadow = true;
// sphere.position.y = 0.5;
// scene.add(sphere);

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: "#777777",
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-3, 3, 3);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Utils
 */
const objectsToUpdate = [];

// #FOR SPHERES
// for optimizing our code we define geometry and material outside
const sphereGeometry = new THREE.SphereBufferGeometry(1, 24, 24);
const sphereMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
});

const createSphere = (radius, position) => {
  // Three.js Mesh
  const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  mesh.scale.set(radius, radius, radius);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js Body
  const shape = new CANNON.Sphere(radius);
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound);
  world.addBody(body);

  // Save in objs to update
  objectsToUpdate.push({
    mesh,
    body,
  });
};
// No need for position to be of type Vec3
// createSphere(0.5, { x: 0, y: 3, z: 0 });
// we can easily create multiple spheres in one go
// createSphere(0.5, { x: 1, y: 3, z: 0 });
// createSphere(0.5, { x: -1, y: 3, z: 0 });

// #FOR CUBES
const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
});

// function for generating a cube
const createCube = (dimensionLength, position) => {
  // Three.js mesh
  const mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
  mesh.scale.set(dimensionLength, dimensionLength, dimensionLength);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  const halfExtents = dimensionLength / 2;
  const shape = new CANNON.Box(
    new CANNON.Vec3(halfExtents, halfExtents, halfExtents)
  );
  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 5, 0),
    shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  // listen for collide event to release the hit sound
  body.addEventListener("collide", playHitSound);
  world.addBody(body);

  // Save in objs to update
  objectsToUpdate.push({
    mesh,
    body,
  });
};

createCube(1, { x: 0, y: 5, z: 0 });

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  // calc the time passed since the last tick
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update the physics World
  // // applying the force on the sphere to mimic the wind
  // sphereBody.applyForce(new CANNON.Vec3(-0.5, 0, 0), sphereBody.position);
  world.step(1 / 60, deltaTime, 3);

  objectsToUpdate.forEach((object) => {
    object.mesh.position.copy(object.body.position);
    object.mesh.quaternion.copy(object.body.quaternion);
  });
  // checking the position of the body in the physical world
  // console.log(sphereBody.position.y);
  // updating the position of the geometry in three.js scene according to the position of an obj in physical World
  // sphere.position.set(
  //   sphereBody.position.x,
  //   sphereBody.position.y,
  //   sphereBody.position.z
  // );
  // sphere.position.copy(sphereBody.position);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

// We can create our own physics with the mix of some math and Raycaster, but for complex pysics it's of course better to use a library.
// We have to create a separate invisible physics world and three/js world, and affect the later one with the 1st one.

// 1st we have to decide if we want a 3D library or 2D one (some 3D interactions can be reduced to 2D physics)

// Good physics libraries are:
// 3D - Ammo, Cannon, Oimo
// 2D - Matter, P2, Planck, Box2D

// There are solutions trying to combine Three.js with physics library like Physijs

// 1st install Cannon.js running npm i cannon, and then import it.
// to create a physics world 1st create an instance of CANNON.World()
// after creating it we have a neutal world. We can add gravity to it using
// .gravity.set() on the instance of the world. Note that gravity is Vec3, similar to Three.js Vector3 except for Cannon.js, to which we pass x,y,z values

// In Three.js for objects to be visible we create Meshes, and in cannon.js we create Bodies, which are objs that will fall and collide with other bodies. As we did in three.js starting with geometries, we have to start with shapes in cannon.js. To create a sphere for ex create an instance of it with CANNON.Sphere(<radius>) method. Note that shape created in the physics world should have the same proportions/size as in three.js world. Next we should create an actual shape body by adding all the characteristics to it like mass, position, shape.
// Finally as we did in three.js we need to add that body to the physics world
// Now for actual visible effects we should tell cannon.js to update body
// To update the world we must use the step() in tick function. We call step() on an instance of the world and pass 3 args: fixed time (1/60 - 60fps), time passed since the last step and how much iterations can world apply to catch up with a potential delay on the scene(3 - for 3 seconds). Don't use getDelta() for the 2nd arg and better create a var and increment it to a current elapsed time after subtractingit from the elapsedTime in tick funciton and saving the val to deltaTime var
// Now we have to take the coordinates of an obj in the physical world and update the position of our geometry on the three.js scene
// Note that we can also use .copy() method to copy the coordinates from cannon.js Vec3  to three.js Vertor3 without any problem
// For floor effect we have to create a separate body using a Plane and assigning it a mass of 0, so that it won't be affected by the gravity and will stay fixed. Note that we can add many shapes to one body making a complex body
// note that by def our sphere looks directly towards the camera and that's why it's moving horizontally towards it.
// Note that in cannon.js rotation is diff and harder than three.js. It only supports the quaternion, so we have to use setFromAxisAngle() method for that.
// The 1st param for that function is the rotation axis and the 2nd one is for angle
// It's like putting stick through the objects and rotating that object in only possible angles and dimensions.
// With this we create an invisible barrier corresponding to our three.js floor

// We can change the friction and bouncing behavior by setting a Material.
// A Material is just a reference and we should create one for each type of material in the scene
// Note that Materials unlike in three.js aren't visible. We only give them some different characteristics
// Also note that these created materials are only associations and not real values
// We have to create a ContactMaterial, which is a combination of 2 Materials and how they should collide
// 1st and 2nd params are Materials, and the 3rd param is an obj that contains collision props like friction and restitution (both are 0.3 by def)
// after creating the contact material add it to the physical world using addContactMaterial() method
// Then we need to associate this materials with the bodies. Simply add material prop with some material referencing val to the Body when you create one
// For simplicity and better performance you can create 1 def material and use it on all bodies by tweaking its props
// We don't even need to assing material props for each created body, but set a default material prop on the world directly
// There are numerous ways to apply forces on the Body
// applyForce - apply a force from a specified point in space(like wind). (USED IN THIS PROJECT)
// applyImpulse - similar to applyForce but istead of adding to force adds to velocity
// applyLocalForce - similar to applyForce but the coordiantes are local to the Body (0,0,0 - center of the body)
// applyLocalImpulse - similar to applyImpulse but the coordinates are local to the Body

// for applyLocalForce we provide Vec3 for force as the 1st arg and the Vec3 for the body point as the 2nd arg
// for applyForce we provide Vec3 for force as the 1st arg and the object point to apply that force on
// applying this methods to couple of objs is OK but things get messy when there are numerous objects on the scene. We need a function to handle this
// So basically we have to create a function wich generates both three.js mesh and cannon.js body, add each created shape to an array, loop through each shape in the tick function and change the position of the three.js mesh to cannon.js body's position on the given frame
// Note that in cannon.js we create a rectangle with Box() which accepts half extent of each dimension, starts measuring from the center of the shape, in Vec3 format
// Note that we can't use the rotation prop of the mesh, so we have to use the quaternion
// Broadphase - when testing the collisions between objs, a naive approach to test every Body agains other Body (not only the nearest one, but all Bodys in the scene). This is bad for performance
// NaiveBroadphase - test every Bodies agains every other Bodies
// GridBroadphase - quadrilles the world and only tests Bodies against other Bodies in the same grid box or the neighbor's grid box
// SAPBroadphase(Sweep And Prune) - tests Bodies on arbitrary axes during multiple steps
// Note that SAPBroadphase is the most optimized version of all, but like in GridBroadphase if the object travels too fast the collision might not be detected.
// To switch to SAPBroadphase, simply instantiate it in the world.broadphase property and use the same world as a param
// Even if we're using an improved broadphase algo, all the Bodies are tested, even those not moving. So what we can do is, when Body speed gets too slow it can fall asleep and not get tested unless additional force is applied on.
// To do that assing true to allowSleep prop of the world
// We can even control how likely it's for th eBody to fall asleep with the sleepSpeedLimit and sleeptimeLimit props.
// We can listen to events on Body like "collide", "sleep", "wakeup". Note that some browsers like Chrome prevent sound playing until an interaction is detected from the users side
// We 1st need to create an Audio and a function to play it. Then we need to listen for simple JS collide event and cal that funtion for playing the sound
// we can pass an arg to collide calback function for sound, which in turn would contain a prop called collision.contact.getImpactVelocityAlongNormal() that contains the collide strength val that we can use to play hit sounds in necessary places
// Constraints enable constraints between 2 bodies
// Some of the main constraints are:
// HingeConstraint - acts like a door hinge
// DistanceConstraint - forces bodies to keep distence between each other
// LockConstraint - merges the bodies if like they were one piece
// PointToPointConstraint - glues the bodies to a specific point

// There are classes, each with their own props, methods and events in cannon.js
// There are many examples in canon.js's website that you can copy the code from and modify for your needs.
// CPU is responsible for our project's physics. Currently everything is handled in one thread, which can quickly overload. The solution is to use workers
// Workers let you put a part of your code in a different thread to spread the load. Youcan then send and receive data from that code nad considerably improve performances
// Cannon.js hasn't been updated for many years, but there is a community driven fork of the cannon.js, cannon-es, which is updated regularly
// Note that, as mentioned before there is an Ammo.js library which is a portage of Bullet (physics engine written in C++) that supports more options, but is harder to learn
// Note that, Physijs library is used to ease the inmplementation of the physics in Three.js world. It uses Ammo.js and natively supports the workers. With it instead of creating the ThreeJS obj and the physics obj, you crate both simultaneously. Physijs will take care of the rest
