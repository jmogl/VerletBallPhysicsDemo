# VerletBallPhysicsDemo
Javascript Ball Physics 2D Simulation using Verlet Integration 
Goal is to learn Javascript making a ball physics simulation
	This app is a work in progress and not intended to be a robust application for every web browser.
	Tested on iPhone & iPad (Chrome and Safari), and Android Nexus 6P. 
	iOS does not allow Portrait lock to be set from Javascript or set full screen, so future version will prompt user to lock portrait mode

	Features:
	- Touching near a ball will pull it to the mouse or touch location. Spring force will hold it in place when dragged around.
	- General sloped wall collision detection
	- Stable stacked balls
	- Balls move based on gravity vector when tilted on a mobile device

	References:
	Verlet integration & 2 pass collision response for stability at rest based on tutorial from:
	http://codeflow.org/entries/2010/nov/29/verlet-collision-with-impulse-preservation/

	Angled wall collision detection and vector methods modified code from:
	Physics for Games, Animations, and Simulations with HTML5 by Dev Ramtel and Adrian Dobre
	ISBN-13: 978-1-4302-6338-8

	Dependencies:
	Hammer.js   - Touch library (http://hammerjs.github.io/)
	Mainloop.js - Managing main loop & FPS (https://github.com/IceCreamYou/MainLoop.js)
	Vector2D.js - Basic vector methods 
