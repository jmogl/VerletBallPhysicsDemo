/*
*	Ball Physics Simulation Javascript Demo - Version 2 - 8/31/17
*	Copyright: 2017 - Jeff Miller
*	License: MIT
*	
*	Goal is to learn Javascript by developing a ball physics simulation.
*	This app is a work in progress and not intended to be a robust application for every web browser.
*	Tested on iPhone & iPad (Chrome and Safari), Android Nexus 6P, Windows 10, and Mac OSX
*	iOS does not allow Portrait lock to be set from Javascript or set full screen, so future version will prompt user to lock portrait mode
*	
*	Features:
*	- Touching near a ball will pull it to the mouse or touch location. Spring force will hold it in place when dragged around.
*	- General sloped wall collision detection
*	- Stable stacked balls
*	- Balls move based on gravity vector when tilted on a mobile device. Intended for Portrait Orientation.
*	
*	References:
*	Verlet integration & 2 pass collision response for stability at rest based on tutorial from:
*	http://codeflow.org/entries/2010/nov/29/verlet-collision-with-impulse-preservation/
*	Angled wall collision detection and vector methods modified code from:
*	Physics for Games, Animations, and Simulations with HTML5 by Dev Ramtel and Adrian Dobre
*	ISBN-13: 978-1-4302-6338-8
*	
*	Dependencies:
*	verletBallSim.js		- Physics Simulation
*	Hammer.js			- Touch library (http://hammerjs.github.io/)
*	Mainloop.js			- Managing main loop & FPS (https://github.com/IceCreamYou/MainLoop.js)
*	Vector2D.js			- Basic vector methods 
*
*	Change Log: 
*	- Setup Hammer.js (Done, note: not compatible with Jquery)
*	- Fix memory leak (Done, 7/22/17 - Using Mainloop.js library to manage FPS)
*	- Add interior angled wall collision detection (8/8/17)
*	- Cleaned up touch code (fixed ball freezing since "tap" was on) and added "the Force" for nearby objects (8/11/17)
*	- Account for ball mass in collisions (Done, 8/13/17)
*	- Added gyro tilt support for gravity vector - 8/15/17 
*	- Add support for Portrait only mode with gyro for gravity response to tilt - 8/15/17
*	- Simplified inclined wall collision response to improve stability - 8/26/17
*	- Added scaling for gravity and touch velocity across devices (displays) - 8/26/17
*	- Turned off tilt mode when device is switched to landscape and provide notification to lock portrait mode - 8/26/17
*	- Cleaned up formatting for GitHub - 9/1/17
*	
*	To Do:
*	- Add simple count for the funnel
*	- Add raytracing :-) (i.e. Use three.js)
*	- Add a GUI usable on a phone device. Currently using a check box to turn the gravity tilt mode on and off is hard to see on a phone.
*/

// Force restrictive declarations
"use strict"; 

// Setup System Globals

// Canvas and Frames Per Second (FPS) Text Counter
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d'); 
var fpsCounter = document.getElementById('fpscounter');

// Tilt checkbox lower right corner for now...
var tiltCheckbox = document.getElementById('tiltcheck');  
	tiltCheckbox.checked = false;	

// Text window at the bottom
var bottomBorderHeight = 35; 

// Simulation scaling
var sim_scale = 1;

// Reduce overall gravity. Standard g = 9.8 m/s^2
const gravity_scale = 0.1;

/*
* Hammer Touch setup
*/
// Screen has been touched
var isDragging = false; 

// Position and velocity of touch or mouse
var touch_Pos = new Vector2D(0,0);	
var touch_Vel = new Vector2D(0,0);	

// Track selected ball number
var touch_Sel = -1;

// Track if ball object has reached touch position when using "the Force"
var touch_Lock = false;				

// Track when the touch stopped to set velocity from hammer touch
var touch_Release = false;			

/*
* Misc Variables
*/

// Temporary for using FPS text field for testing
var troubleshooting = 0;

// To address jitter when draging a ball along an angled wall
var increasedamping = 1;

// Gravity vector
var gravityVec = new Vector2D(0,0); 

// Check for Android, since x/y coordinates are flipped for gyro gravity vector
var OS_Android = false;

// Track device orientation based on window dimensions
var orientchk = true;

// Used for portrait orientation notification
var tiltsupport = true;

// Create a simple Hammer touch instance. By default it only adds horizontal recognizers
var mc = new Hammer(canvas);

// Initialize function
window.onload = init; 

// Resize canvas if tablet or phone is rotated
window.onresize = function(){

	// Reload web page since boundary conditions have changed
	// Todo: freeze application until device is rotated back to portrait mode
	window.location.reload(false); //true reloads all resources

};

function getOrientation(){
	var orientation = window.innerWidth > window.innerHeight ? "Landscape" : "Portrait";

	// Turn off tilt mode if device is in Landscape mode
	if (orientation == "Landscape"){
		tiltCheckbox.checked = false;
		orientchk = false;
	}else {
		tiltCheckbox.checked = true;
		orientchk = true;
	}
}

// initialize the simulation
function init() { 

	// Clear console for debugging
	console.clear();

	// Set canvas width just short of full screen to eliminate scroll bars	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Turn off Tilt mode in landscape (axis flips on iOS)
	getOrientation();
	
	// Scale to standard height of sim is 1200
	sim_scale = canvas.height / 1200;

	// Set the Hammer pan gesture to support all directions.
	// this will block the vertical scrolling on a touch-device while on the element
	mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });
		
	var simulation = new Simulation(context);

	// Setup accelerometer support for mobile devices
	if (window.DeviceMotionEvent==undefined) {
		
		// Set default gravity to bottom of device: Y-axis
		gravityVec = new Vector2D(0.0,9.8 * gravity_scale);
		tiltsupport = false;
		}
		else {
			window.addEventListener('devicemotion', handleMotionEvent); // Accelerometer gravity vector
			tiltsupport = true;
	}

	// Check to see if OS is Android since gyro x/y axis are flipped (From Stack Overflow)
	var ua = navigator.userAgent.toLowerCase();
	var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
	if(isAndroid) {
		OS_Android = true;
	}
};

// Motion Event Handler - Get gravity vector from accel / gyro
function handleMotionEvent(event) {	
	var axisflip = 1;

	if (OS_Android == true){
		axisflip = -1;
	}

	var ax = event.accelerationIncludingGravity.x * axisflip;
	var ay = event.accelerationIncludingGravity.y * -1 * axisflip;
	var az = event.accelerationIncludingGravity.z;

	// check to see if accelerationIncludingGravity is not supported
	var accelcheck = ax + ay + az;

	if (accelcheck == 0) {
		tiltsupport = false;
	}

	if (tiltsupport == false || tiltCheckbox.checked == false){ 
		gravityVec.x = 0;
		gravityVec.y = 9.8 * gravity_scale * sim_scale;
		tiltCheckbox.checked = false; // uncheck if gravity vector not supported
	} else {		
		gravityVec.x = ax * gravity_scale*sim_scale;
		gravityVec.y = ay * gravity_scale*sim_scale;
		tiltsupport = true;
	}
}
	
// Listen to Hammer Touch events... On Touch
mc.on("panleft panright panup pandown press", function(ev) {
	isDragging = true; // user is touching the screen or clicking mouse
	
	// Store touch location and velocity
	touch_Pos = new Vector2D(ev.center.x,ev.center.y);
	touch_Vel = new Vector2D(ev.velocityX*sim_scale,ev.velocityY*sim_scale);
});

// Listen to Hammer Touch events... On Release
mc.on("panend pressup", function(ev) {
	isDragging = false; // user is touching the screen or clicking mouse
	touch_Sel = -1;
	console.log("Touch release");
});

//Each body (ball) has a radius, position, color, mass, previous position and accumulated acceleration
var Body = function(x, y, radius, color, mass){	
	if(typeof(color)==='undefined') color = '#0000ff';
	if(typeof(mass)==='undefined') mass = 1;
	this.position = new Vector2D(x, y);
	this.previouspos = new Vector2D(x, y);
	this.velocity = new Vector2D(x, y);
	this.previousvel = new Vector2D(x, y);
	this.acceleration = new Vector2D(0, 0);	 
	this.radius = radius;
	this.color = color;
	this.mass = mass;
	this.touchmass = mass*100; //Plan to use when touching ball and colliding when using mass to set a high value so balls bounce off  
}

Body.prototype = {
	
	//Acceleration on a body is accumulated in the acceleration components and this method 
	//transfers the accumulated acceleration to a new current position
	accelerate: function(delta){
		this.acceleration.scaleBy(delta*delta);
		var position = this.position.add(this.acceleration); 
		this.position = position;
		this.acceleration.zero();              
	},
		
	//Transfer of existing inertia to a new position in a verlet integration step is done by the following method:
	inertia: function(delta){
		var position = this.position
			.multiply(2)
			.subtract(this.previouspos);     
		this.previouspos = this.position;
		this.position = position; 
	},

	draw: function(context){
		context.beginPath();
		context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI*2, false);
		context.fillStyle = this.color;
		context.fill();
	},
}

// Interior walls with collision detection
// Wall objects (Vector Point 1, Vector Point 2)
function Wall(p1,p2){	
	this.p1 = p1;
	this.p2 = p2;	
	this.objwallside=[]; //store side for each object that can hit the wall
	this.side = 1;
	this.edge = false; // Wall does not have a free edge (i.e. perimeter wall would be false) 
}

Wall.prototype = {

	// Vector in direction of the wall
	get dir (){		
		return this.p2.subtract(this.p1);		
	},

	// Vector perp to wall - TODO: Store normal on initialization
	get normal (){
		return this.dir.perp(1);			
	},

	draw: function (context) {  		
		context.save();
		context.strokeStyle = '#ff0000';
		context.lineWidth = 1;
		context.beginPath();		
		context.moveTo(this.p1.x,this.p1.y);
		context.lineTo(this.p2.x,this.p2.y);	
		context.closePath();		
		context.stroke();
		context.restore();
	}
};	

// Draw Lines not used for interior wall collision detection
function Line(p1,p2){	
	this.p1 = p1;
	this.p2 = p2;	
}

Line.prototype = {
	draw: function (context) {  		
		context.save();
		context.strokeStyle = '#000000';
		context.lineWidth = 1;
		context.beginPath();		
		context.moveTo(this.p1.x,this.p1.y);
		context.lineTo(this.p2.x,this.p2.y);	
		context.closePath();		
		context.stroke();
		context.restore();
	}
};	

var Simulation = function(context){
	var bodies = this.bodies = [];

	// Leave space at bottom because of iOS control screen drag up with finger swipe
	var width = context.canvas.width;
	var height = context.canvas.height - bottomBorderHeight; 
	
	// Energy loss on collision (1=elastic)
	var damping = 0.8;	
	var interval;
	
	// for interior collision detection
	var walls = new Array();	
	
	// Gravity body constant for nearest ball attraction during touch (1 for now)
	const G = 1; 	
	
	// Gravity force to attract nearest ball to touch position
	var useTheForce = new Vector2D(0.0, 0.0); 
	
	// Check for wall side setup
	var initwallcheck = false;	
	
	// Blue, Red, Vibrant Green, Orange
	var colors = ['#0000ff', '#ff0000', '#00ff00', '#ffa500'];	
	
	// Max number of balls on screen. 
	const balls_Max = 100;
	
	while(bodies.length < balls_Max){

		// bodies(x,y,radius,color,mass) - All random
		// Ball mass = density * volume (4/3 * pi * r^3)
		
		// Load balls to the left of funnel to avoid generation onto wall
		var bodyX = Math.random() * (width/4) + 25; 
		var bodyY = Math.random() * (height/2) + 25;
		
		var bodyRadius = Math.random() * 20 + 6; 
		var bodyDensity = 1; // All balls are same density
		var bodyColor = colors[Math.floor(Math.random()*colors.length)]; 	
		var bodyMass = bodyDensity * (4/3 * Math.PI * bodyRadius ^ 3); 
		 
		var body = new Body(
			bodyX,   
			bodyY,
			bodyRadius,
			bodyColor,
			bodyMass
			);

		var collides = false;

		for(var i=0, l=bodies.length; i<l; i++){
			var other = bodies[i];
			
			// Dist between balls
			var length = other.position.distance(body.position); 
			
			if(length < other.radius + body.radius){
				collides = true;
				break;
			}
		}

		if(!collides){
		
			// Load ball if location does not overlap
			bodies.push(body); 
		}
	}

	// Define line for bottom border. Not using interior wall for maximum stability since they have added impulse
	var bottomBorder = new Line(new Vector2D(0,height),new Vector2D(width,height));

	// Interior angled walls with collision detection (i.e. The Funnel)
	while(walls.length < 2 ){

		// Scaling for width and height
		var wall1=new Wall(new Vector2D((width/3),height/6),new Vector2D((width/2.2),height/3.5));
		walls.push(wall1);
			
		var wall2=new Wall(new Vector2D(width*0.68,height/6),new Vector2D((width/1.8),height/3.5));
		walls.push(wall2);
	}
		
	if (initwallcheck == false){ 
		initCheckSide(); // Setup wall side check
	}
	
	// Pick nearest ball when user is touching screen or clicking mouse
	var selectObject = function(){

		// only check once while dragging since nearest ball is picked
		if (isDragging==true && touch_Sel < 0){ 
		
			// insure tracking is larger then display
			var distTestMax = canvas.width*1000; 
			for (var i=0, l=bodies.length; i<l; i++){
				var bodytest = bodies[i];
				
				// Distance from ball object to user touch position
				var distTest = bodytest.position.distance(touch_Pos); 	
					
				if (distTest < distTestMax){
				
					// store distance
					distTestMax = distTest; 
						
					// store closest object number
					touch_Sel = i; 
					}
				}
			
			console.log("Ball " + touch_Sel + " Selected");
		}
	}

	var collide = function(preserve_impulse){

		var dist = new Vector2D(0,0);

		for(var i=0, l=bodies.length; i<l; i++){
			var body1 = bodies[i];

			for(var j=i+1; j<l; j++){
				var body2 = bodies[j]; 
				dist = body1.position.subtract(body2.position);
				var length = dist.length();
				var target = body1.radius + body2.radius;

				// if the spheres are closer than their radii combined:
				if(length < target){

					// record previous velocity						
					body1.previousvel = body1.position.subtract(body1.previouspos); // b1 position - b1 previous position
					body2.previousvel = body2.position.subtract(body2.previouspos);
					
					// resolve the body overlap conflict
					var factor = (length-target)/length;
					body1.position.x -= dist.x*factor*0.5; // Todo: Clean this section up
					body1.position.y -= dist.y*factor*0.5;
					body2.position.x += dist.x*factor*0.5;
					body2.position.y += dist.y*factor*0.5;

					if(preserve_impulse){
					
						// normal velocity vectors just before the impact
						var normalVelo1 = body1.previousvel.project(dist);
						var normalVelo2 = body2.previousvel.project(dist);
						
						// tangential velocity vectors
						var tangentVelo1 = body1.previousvel.subtract(normalVelo1);
						var tangentVelo2 = body2.previousvel.subtract(normalVelo2);
						var m1 = body1.mass;
						var m2 = body2.mass;
						var u1 = normalVelo1.projection(dist);
						var u2 = normalVelo2.projection(dist);	
							
						// using coefficient of restitution for normal component
						var v1 = ((m1-damping*m2)*u1+(m2+damping*m2)*u2)/(m1+m2);
						var v2 = ((m2-damping*m1)*u2+(m1+damping*m1)*u1)/(m1+m2);
						
						// normal velocity vectors after collision
						normalVelo1 = dist.para(v1);
						normalVelo2 = dist.para(v2);
							
						// final velocity vectors after collision	
						body1.previousvel = normalVelo1.add(tangentVelo1);
						body2.previousvel = normalVelo2.add(tangentVelo2);
							
						// the previous position is adjusted
						// to represent the new velocity
						body1.previouspos = body1.position.subtract(body1.previousvel);
						body2.previouspos = body2.position.subtract(body2.previousvel);
					}
				}
			}
		}
	}

	// Border Collision with impulse preservation
	// Simple X/Y check for maximum stability for balls stacked at rest
	var border_collide_preserve_impulse = function(){
		for(var i=0, l=bodies.length; i<l; i++){
			var body = bodies[i];
			var radius = body.radius;
			var x = body.position.x;
			var y = body.position.y;
			if(x-radius < 0){
				var vx = (body.previouspos.x - body.position.x)*damping;
				body.position.x = radius;
				body.previouspos.x = body.position.x - vx;
			}
			else if(x + radius > width){
				var vx = (body.previouspos.x - body.position.x)*damping;
				body.position.x = width-radius;
				body.previouspos.x = body.position.x - vx;
			}
			if(y-radius < 0){
				var vy = (body.previouspos.y - body.position.y)*damping;
				body.position.y = radius;
				body.previouspos.y = body.position.y - vy;
			}
			else if(y + radius > height){
				var vy = (body.previouspos.y - body.position.y)*damping;
				body.position.y = height-radius;
				body.previouspos.y = body.position.y - vy;
			}
		}
	}

	// Border Collision without impulse preservation
	// Simple X/Y check for maximum stability for balls stacked at rest
	var border_collide = function(){
		for(var i=0, l=bodies.length; i<l; i++){
			var body = bodies[i];
			var radius = body.radius;
			var x = body.position.x;
			var y = body.position.y;

			// Wall Border Collision Check	
			if(x-radius < 0){
				body.position.x = radius;
			}
			else if(x + radius > width){
				body.position.x = width-radius;
			}
			if(y-radius < 0){
				body.position.y = radius;
			}
			else if(y + radius > height){
				body.position.y = height-radius;
			}
		}
	}

	// Interior angled Wall collision detection - need to check side for interior wall objects
	function initCheckSide(){  // Initialize wall side check for tunneling 
		for (var i=0; (i<walls.length); i++){
			for(var j=0; j<bodies.length; j++){
				var ball1 = bodies[j];
				var wall = walls[i];
				var wdir = wall.dir;
				var ballp1 = wall.p1.subtract(ball1.position);
				var proj1 = ballp1.projection(wdir);
				var dist = ballp1.addScaled(wdir.unit(), proj1*(-1));
				setSide(dist,wall,j); 
			}
		}
		initwallcheck = true; // Wall array check has been initialized
	}

	// Track which side each object (i.e ball) is relative to wall
	function setSide(dist,wall,objnum){
		if (dist.dotProduct(wall.normal) > 0){

			// wall side = 1
			if (initwallcheck == false){
				wall.objwallside.push(1); //Load track ball location for tunneling check into array
			} else {
				wall.objwallside[objnum] = 1; // Update wall side check
			}

		}else{

			if (initwallcheck == false){
				
			// wall side = -1
				wall.objwallside.push(-1); //Load track ball location for tunneling check into array
			} else {
				wall.objwallside[objnum] = -1; // Update wall side check
			}
		}
	}	
		
	// Angled Wall collision based on code from Physics for Javascript book referenced at the top
	// Code updated to handle multiple balls and increased stability
	var checkWallBounce = function(){
		var hasHitAWall = false;
		var walldamping = 0.7;
		for(var j=0; j<bodies.length; j++){
			for (var i=0; (i<walls.length && hasHitAWall==false); i++){
				var obj = bodies[j];
				var wall = walls[i];		
					
				// wdir is a Vector in direction of the wall
				var wdir = wall.dir; 
				
				// Vector from ball to wall end pt 1 "b1"
				var ballp1 = wall.p1.subtract(obj.position); 
					
				// Vector from ball to wall end pt 2 "b2"
				var ballp2 = wall.p2.subtract(obj.position); 
				
				// Projection of b1 vector in direction of wall
				var proj1 = ballp1.projection(wdir);
				
				// Projection of b2 vector in direction of wall
				var proj2 = ballp2.projection(wdir); 
				var dist = ballp1.addScaled(wdir.unit(), proj1*(-1)); 
					
				// Perp Vector from ball to wall
				// Length of both projections is less then length of wall, means ball is between endpoints of wall
				var test = ((Math.abs(proj1) < wdir.length()) && (Math.abs(proj2) < wdir.length()));
				var testTunneling;				
					
				if (wall.objwallside[j]*dist.dotProduct(wall.normal) < 0){
					testTunneling = true;
				} else {
					testTunneling = false;
				}	
					
				// Adjust damping if holding ball against wall to reduce jitter due to spring force bouncing
				if (j == touch_Sel){
					increasedamping = 0.00001;
				} else {
					increasedamping = 1;
				}		

				obj.velocity = obj.position.subtract(obj.previouspos);
				setSide(dist,wall,j);	

				if (( (dist.length() < obj.radius) || (testTunneling) ) &&  test){

				// 	Incident angle from older code no longer used for stability reasons, but may be useful later
				//	var angle = Vector2D.angleBetween(obj.velocity, wdir); 
						
					var normal = wall.normal;
			
					if (normal.dotProduct(obj.velocity) > 0){
						normal.scaleBy(-1);
					}
						
					// Move the ball back out of the wall. Dot product handles either side of wall (d is neg infront)
					// Direction is normal to wall + 2 for impulse to minimize balls getting stuck
					var deltaS = obj.radius+dist.dotProduct(normal)+2;
					
					if (testTunneling == false){
						var displ = dist.para(deltaS);
					} else {
						displ = dist.para(-deltaS);
					}
						
					// Corrected position
					obj.position = obj.position.subtract(displ); 
						
					// Velocity Correction due to gravity
					var vcor = 1-gravityVec.dotProduct(displ)/obj.velocity.lengthSquared(); 
						
					var Velo = obj.velocity.multiply(vcor);
					var normalVelo = dist.para(Velo.projection(dist));
					var tangentVelo = Velo.subtract(normalVelo);
						
					// Flip normal post impact * damping factor
					obj.previousvel = tangentVelo.addScaled(normalVelo,-walldamping*increasedamping); 						
					obj.previouspos = obj.position.subtract(obj.previousvel);
						
					if (testTunneling){
						wall.objwallside[j] *= -1;
					}
					hasHitAWall = true;
					console.log("hasHitAwall = " + hasHitAWall);
				}

				// Bounce off end point 
				else if (Math.abs(ballp1.length()) < obj.radius){
					bounceOffEndpoint(obj,wall.p1);
					hasHitAWall = true;
				}
				else if (Math.abs(ballp2.length()) < obj.radius){
					bounceOffEndpoint(obj,wall.p2);
					hasHitAWall = true;
				}	
			}
		}
	}


	function bounceOffEndpoint(obj,pEndpoint){
		var walldamping = 0.7;
		var distp = obj.position.subtract(pEndpoint);
		
		// Move ball away from edge 
		// Modified code for increased stability
		var distcvec = obj.position.subtract(pEndpoint);
		var distcorr = distcvec.length()-obj.radius;
		var distcvec2 = distcvec.para(distcorr);	
		obj.position = obj.position.subtract(distcvec2);
		
		// normal velocity vector just before the impact
		var normalVelo = obj.velocity.project(distp);
	
		// tangential velocity vector
		var tangentVelo = obj.velocity.subtract(normalVelo);
			
		// normal velocity vector after collision				
		normalVelo.scaleBy(-walldamping*increasedamping);
		
		// final velocity vector after collision
		obj.previousvel = normalVelo.add(tangentVelo);	
		obj.previouspos = obj.position.subtract(obj.previousvel);
		console.log("has hit Edge");
	}

	var draw = function(){
		context.clearRect(0, 0, width, height + bottomBorderHeight);
		context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
		context.fillStyle = 'rgba(234, 151, 43, 1.0)';
		var k = 0.008; // Spring constant for drag spring force
		var objToTouchVec = new Vector2D(0,0);
			
		// Draw bottom border
		bottomBorder.draw(context);
			
		// Draw balls
		for(var i=0, l=bodies.length; i<l; i++){
			if (touch_Sel > - 1){  // Ball is being dragged or touched
					
				// Vector between nearest ball and touch screen position
				objToTouchVec = bodies[touch_Sel].position.subtract(touch_Pos); 
			
				// If object is closer then diameter of the ball object, lock to touch position to account for dragging at high speed using spring force
				// This stops the ball being dragged through the wall, but strong enough to drag ball around
				if (bodies[touch_Sel].position.distance(touch_Pos) < bodies[touch_Sel].radius*4){
						
					// Use stiff spring force when object is near touch position so ball doesn't travel through wall
					useTheForce = spring(k,objToTouchVec); 
					bodies[touch_Sel].acceleration.incrementBy(useTheForce); 
				}
				else
				{
					// Attract nearest ball if distance is close enough (G, mass1, mass2, vector)
					useTheForce = theForce(G,20, 20, objToTouchVec); 
					bodies[touch_Sel].acceleration.incrementBy(useTheForce); 
				}
			}
			bodies[i].draw(context);               
		}

		// Draw interior walls
		for(var j=0, len=walls.length; j<len; j++){
		// Interior walls for now
			walls[j].draw(context);
		}
	}

	// Gravitational attraction between two objects (i.e. touch position and nearest ball for attraction)
	// G, mass1, mass2, vector (object2-object1)
	var theForce = function(G,m1,m2,r){
		return r.multiply(-G*m1*m2/(r.lengthSquared()*r.length()));
		}
		
	// Spring Force	
	var spring = function (k,r){
		return r.multiply(-k);
		}		

	// General gravity force
	var gravity = function(){
		for(var i=0, l=bodies.length; i<l; i++){
			bodies[i].acceleration.incrementBy(gravityVec);           
		}
	}

	var accelerate = function(delta){
		for(var i=0, l=bodies.length; i<l; i++){
			bodies[i].accelerate(delta);
		}
	}

	var inertia = function(delta){
		for(var i=0, l=bodies.length; i<l; i++){
			bodies[i].inertia(delta);
		}
	}

	/*
	*	Notes From velocity verlet tutorial referenced at top to address stacked ball stability:
	*	
	*	The simulation maintains a list of all bodies and runs this method for each simulation step:
	*	Gravity accumulates the gravitational acceleration on bodies, accelerate moves the bodies according to acceleration. 
	*	Note that this results in a higher velocity (as it should) in the verlet integration scheme, since the current position 
	*	moved away further from the previous position. Collide resolves body vs. body constraints (two spheres may not overlap)
	*	
	*	Acceleration at rest and ghost impulse (i.e. jitter):
	*	If you think about the problem it's obvious why the ghost impulse is introduced. If a sphere lies at rest in equilibrium 
	*	on top of another sphere or the floor, then the acceleration creates velocity where none would have existed in the first place. 
	*	The characteristic of acceleration at rest is that the pushback from the constraint exactly cancels the acceleration out.
	*	The idea of correcting the simulation for this is to go it in two steps.
	*	Accumulate forces and move object, resolve constraints but without preserving impulse. This gives an object the chance to 
	*	cancel acceleration impulse out when in equilibrium.
	*	The resulting velocity remaining after step 1 must have been unconstrained, therefore it is now real impulse, so we can 
	*	move the object by its inertia and preserve its impulse when constrained.
	*/		
	var step = function(){
		var steps = 2; // 2 original steps; increase steps per interval for increased accuracy
		var delta = 1/steps;
		for(var i=0; i<steps; i++){
			selectObject();     // Pick a ball if user touches screen
			gravity();
			accelerate(delta);
			checkWallBounce();
			collide(false);
			border_collide();
			inertia(delta);
			collide(true);
			border_collide_preserve_impulse();
		}
		draw();
	}

	// Start the main loop using Mainloop.js library to manage FPS
	MainLoop.setUpdate(step).setDraw(draw).setEnd(end).start();
	/*
	* MainLoop end function
	* Updates the FPS counter.
	*
	* @param {Number} fps
	* 	The smoothed frames per second.
	* @param {Boolean} panic
	* 	Whether the main loop panicked because the simulation fell too far behind real time.
	*/

	function end(fps, panic) {
		if (orientchk == false && tiltsupport == true){
			var notifytxt = ", Turn on device rotation lock in Portrait Mode when using Tilt mode!"
			} else {
			notifytxt = " ";
		}

		// Mainloop FPS counter text
		fpsCounter.textContent = parseInt(fps, 10) + ' FPS' + notifytxt; 
//		fpsCounter.textContent = parseInt(troubleshooting, 10) + ' Troubleshooting'; // Use FPS text to temporarily display "test" value

		if (panic) {
		// This pattern introduces non-deterministic behavior, but in this case
		// it's better than the alternative (the application would look like it
		// was running very quickly until the simulation caught up to real
		// time). See the documentation for `MainLoop.setEnd()` for additional
		// explanation.
			var discardedTime = Math.round(MainLoop.resetFrameDelta());
			console.warn('Main loop panicked, probably because the browser tab was put in the background. Discarding ' + discardedTime + 'ms');
		}
	}
}
