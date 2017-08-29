# VerletBallPhysicsDemo
Javascript Ball Physics 2D Simulation using Verlet Integration. 
Goal is to learn Javascript! Next major version will use Three.js 3D library.
	This app is a work in progress and not intended to be a robust application for every web browser.
	Tested on iPhone & iPad (Chrome and Safari), and Android Nexus 6P. 
	iOS does not allow Portrait lock to be set from Javascript or full screen mode, so future version will prompt user to lock portrait mode.

	Jeff Miller - Last Update 8/28/17
	Released under MIT License
	
	Features:
	- Touching near a ball will pull it to the mouse or touch location. Spring force will hold it in place when dragged
	- General sloped wall collision detection
	- Stable stacked balls
	- Balls move based on gravity vector when tilted on a mobile device

	References:
	Verlet integration & 2 pass collision response for stability at rest based on tutorial from:
	http://codeflow.org/entries/2010/nov/29/verlet-collision-with-impulse-preservation/

	Angled wall collision detection and vector methods built from:
	Physics for Games, Animations, and Simulations with HTML5 by Dev Ramtel and Adrian Dobre
	ISBN-13: 978-1-4302-6338-8
	Made modifications to angled wall algorithm for multiple ball stability

	Dependencies:
	Hammer.js   - Touch library (http://hammerjs.github.io/)
	Mainloop.js - Managing main loop & FPS (https://github.com/IceCreamYou/MainLoop.js)
	Vector2D.js - Basic vector methods 
	
	To DO:
	- Mac OS Safari window.DeviceMotionEvent not correctly detecting no accelerometer on older Macbook Pro
	- Add a GUI for phones. The small checkbox on the lower right is hard to see on small devices.

