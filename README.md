Verlet Ball Physics Demo

Javascript Ball Physics 2D Simulation using Verlet Integration. Goal is to learn Javascript! Next major version will use Three.js 3D library. This app is a work in progress and not intended to be a robust application for every web browser. Tested on iPhone & iPad (Chrome and Safari), and Android Nexus 6P.

Jeff Miller 
Released under MIT License

Features:
- Touching near a ball will pull it to the mouse or touch location. Spring force will hold it in place when dragged
- General sloped wall collision detection
- Stable stacked balls
- Balls move based on gravity vector when tilted on a mobile device. If mobile device is in landscape, tilt 
  mode is turned off and user is prompted to rotate to Portrait with Orientation lock turned on.

[Ball Physics Demo Webpage](https://jmogl.github.io/VerletBallPhysicsDemo/)	

References:
Verlet integration & 2 pass collision response for stability at rest based on tutorial from:
http://codeflow.org/entries/2010/nov/29/verlet-collision-with-impulse-preservation/

Angled wall collision detection and vector methods built from:
Physics for Games, Animations, and Simulations with HTML5 by Dev Ramtel and Adrian Dobre
ISBN-13: 978-1-4302-6338-8
Made modifications to angled wall algorithm for multiple ball stability

Dependencies:

verletBallSim.js - Physics code
Hammer.js   - Touch library (http://hammerjs.github.io/)
Mainloop.js - Managing main loop & FPS (https://github.com/IceCreamYou/MainLoop.js)
Vector2D.js - Basic vector methods 

To Do:
- Add a GUI for phones. The small checkbox on the lower right is hard to see on small devices.
