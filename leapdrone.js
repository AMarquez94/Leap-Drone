/**
 * LeapDrone 
 *
 * Authors: 
 *  -Alejandro Marquez
 *  -David Vergara
 *  -Wenceslao Martinez
 */

var Cylon = require('cylon');

//VARIABLES
var flying = false;
var init = false;
var startRecording = false;
var flips = true;
var handInitialPosition = [];
var handInitialDirection = [];

var up_lastframe = false;
var down_lastframe = false;
var right_lastframe = false;
var left_lastframe = false;
var forward_lastframe = false;
var backwards_lastframe = false;
var stop_lastframe = false;
//CONSTANTS
var X_THRESHOLD = 80;
var Z_THRESHOLD = 80;
var Y_THRESHOLD_UP = 80;
var Y_THRESHOLD_DOWN = -50;
var COOLDOWN = 6000;
var STOPCOOLDOWN = 6000;
var FLIP_TIME = 10;

Cylon.robot({
	connections: {
		leapmotion: {adaptor: 'leapmotion'},
		ardrone: { adaptor: 'ardrone', port: '192.168.1.1' }
	},

	devices: {
		leapmotion: {driver: 'leapmotion', connection: 'leapmotion'},
		drone: {driver: 'ardrone', connection: 'ardrone'}
	},

	work: function(my){
	
		my.leapmotion.on('frame', function(frame){
			if(!init){
			
				//First keyTap -> We have to set the virtual cube in which the dron
				//will not move when the hand is inside it.
				if(frame.valid && frame.gestures.length > 0){
					frame.gestures.forEach(function(g){
						if(g.type == 'keyTap'){
						
							//Sets the actual hand position as the center of the cube
							handInitialPosition = frame.hands[0].palmPosition;
							handInitialDirection = frame.hands[0].direction;
							console.log('Position ' + handInitialPosition);
							console.log('Direction ' + handInitialDirection);
							console.log('Initial hand detected');
							init = true;
							startRecording = true;
						}
					})
					
				}
			}
			else{
			
				//Cube was already set -> Now keyTaps are for taking off/landing
				if(frame.valid){
					if(frame.hands.length > 0){
						
						//Leap Motion detects a hand
						if(flying){
							
							var handPosition, handDirection;
							
							handPosition = frame.hands[0].palmPosition;	//Actual hand position
							handDirection = frame.hands[0].direction;	//Actual hand direction
							
							/* True if hand has moved along the X axis outside the cube */
							var x = Math.abs(handPosition[0] - handInitialPosition[0]) > X_THRESHOLD;
							
							/* True if hand has moved along the Z axis outside the cube */
							var z = Math.abs(handPosition[2] - handInitialPosition[2]) > Z_THRESHOLD;
							
							/* True if hand has moved up outside the cube */
							var y_up = (handPosition[1] - handInitialPosition[1]) > Y_THRESHOLD_UP;
							
							/* True if hand has moved down outside the cube */
							var y_down = (handPosition[1] - handInitialPosition[1]) < Y_THRESHOLD_DOWN;
							var moved = x || z || y_up || y_down;
							
							if(moved){
								if(x){
									var right = (handPosition[0] - handInitialPosition[0]) > 0;
									
									if(right){
									
										//We move drone to right as hand moved right
										if(!right_lastframe){
										
											//If drone was going right in last frame, do not send
											//that message again
											my.drone.right(0.2);
											console.log("Moving drone to right (message)");
										}
										up_lastframe = false;
										down_lastframe = false;
										right_lastframe = true;
										left_lastframe = false;
										forward_lastframe = false;
										backwards_lastframe = false;
										stop_lastframe = false;
									}
									else{
									
										//We move drone to left as hand moved left
										if(!left_lastframe){
										
											//If drone was going left in last frame, do not send
											//that message again
											my.drone.left(0.2);
											console.log("Moving drone to left (message)");
										}
										up_lastframe = false;
										down_lastframe = false;
										right_lastframe = false;
										left_lastframe = true;
										forward_lastframe = false;
										backwards_lastframe = false;
										stop_lastframe = false;
									}
								}
							
								else if(z){
									var backwards = (handPosition[2] - handInitialPosition[2]) > 0;
								
									if(backwards){	

										//We move drone backwards as hand moved backwards									
										if(!backwards_lastframe){
										
											//If drone was going backwards in last frame, do not send
											//that message again
											my.drone.back(0.2);
											console.log("Moving drone backwards (message)");
										}
										up_lastframe = false;
										down_lastframe = false;
										right_lastframe = false;
										left_lastframe = false;
										forward_lastframe = false;
										backwards_lastframe = true;
										stop_lastframe = false;
									}
									else{
									
										//We move drone backwards as hand moved backwards
										if(!forward_lastframe){
										
											//If drone was going forward in last frame, do not send
											//that message again
											my.drone.forward(0.2);
											console.log("Moving drone forward (message)");
										}
										up_lastframe = false;
										down_lastframe = false;
										right_lastframe = false;
										left_lastframe = false;
										forward_lastframe = true;
										backwards_lastframe = false;
										stop_lastframe = false;
									}
								}
							
								else if(y_up){		

									//We move drone up as hand moved upwards
									if(!up_lastframe){
									
										//If drone was going up in last frame, do not send
										//that message again
										my.drone.up(0.3);
										console.log("Moving drone up (message)");
									}
									up_lastframe = true;
									down_lastframe = false;
									right_lastframe = false;
									left_lastframe = false;
									forward_lastframe = false;
									backwards_lastframe = false;
									stop_lastframe = false;
								}
							
								else if(y_down){
								
									//We move drone down as hand moved down
									if(!down_lastframe){
									
										//If drone was going down in last frame, do not send
										//that message again
										my.drone.down(0.3);
										console.log("Moving drone down (message)");
									}
									up_lastframe = false;
									down_lastframe = true;
									right_lastframe = false;
									left_lastframe = false;
									forward_lastframe = false;
									backwards_lastframe = false;
									stop_lastframe = false;
								}
							}
							if(flying){
								if(!stop_lastframe && !moved){
									my.drone.stop();
									up_lastframe = false;
									down_lastframe = false;
									right_lastframe = false;
									left_lastframe = false;
									forward_lastframe = false;
									backwards_lastframe = false;
									stop_lastframe = true;
								}
								if(frame.gestures.length > 0){
								
									//User made gestures
									frame.gestures.forEach(function(g){
										if(g.type == 'keyTap' && !moved){
										
											//Gesture was a keyTap and drone was flying
											//-> Land it
											flying = false;
											my.drone.land();
											my.drone.stop();
											up_lastframe = false;
											down_lastframe = false;
											right_lastframe = false;
											left_lastframe = false;
											forward_lastframe = false;
											backwards_lastframe = false;
											stop_lastframe = true;
											console.log('LAND');
										}
										
										else if(g.type == 'circle' && !moved){
										
											//Gesture was a circle -> Turn the drone
											
											if(g.normal[2] < 0){
												
												//Turn drone clockwise
												my.drone.clockwise(0.3);
												console.log('Turning right');
												up_lastframe = false;
												down_lastframe = false;
												right_lastframe = false;
												left_lastframe = false;
												forward_lastframe = false;
												backwards_lastframe = false;
												stop_lastframe = false;
											}
											else{
											
												//Turn drone counter clockwise
												my.drone.counterClockwise(0.3);
												console.log('Turning left');
												up_lastframe = false;
												down_lastframe = false;
												right_lastframe = false;
												left_lastframe = false;
												forward_lastframe = false;
												backwards_lastframe = false;
												stop_lastframe = false;
											}
										}
										
										else if(g.type == 'swipe'){
										
											//Gesture was a swipe -> we calculate
											//the swipe direction, to make a flip
											//in that direction. After a flip, sets
											//a period of cooldown, in which the dron
											//will not be able to perform more flips
											var currentPosition = g.position;
											var startPosition = g.startPosition;

											var xDirection = currentPosition[0] - startPosition[0];
											var yDirection = currentPosition[1] - startPosition[1];
											var zDirection = currentPosition[2] - startPosition[2];

											var xAxis = Math.abs(xDirection);
											var yAxis = Math.abs(yDirection);
											var zAxis = Math.abs(zDirection);

											var superiorPosition  = Math.max(xAxis, yAxis, zAxis);

											if(superiorPosition === xAxis){
												if(xDirection < 0){
													if(flips){
													
														//Left flip
														my.drone.stop();
														my.drone.leftFlip(0.1);
														flips = false;
														console.log('Swipe left');
														setTimeout(enableFlip, COOLDOWN);
													}
													
												} else {
													if(flips){
													
														//Right flip
														my.drone.stop();
														my.drone.rightFlip(0.1);
														flips = false;
														console.log('Swipe right');
														setTimeout(enableFlip, COOLDOWN);
													}
												}
											}
											
											else if(superiorPosition === zAxis){
												if(yDirection > 0){
													if(flips){
													
														//Front flip
														my.drone.stop();
														my.drone.frontFlip(0.1);
														flips = false;
														console.log('Swipe front');
														setTimeout(enableFlip, COOLDOWN);
													}
												} else {
													if(flips){
													
														//Back flip
														my.drone.stop();
														my.drone.backFlip(0.1);
														flips = false;
														console.log('Swipe back');
														setTimeout(enableFlip, COOLDOWN);
													}
												}
											}
										}
									})
								}
							}
						}
						else{
							if(frame.gestures.length > 0){
								frame.gestures.forEach(function(g){
									if(g.type == 'keyTap'){
									
										//Key tap detected, and drone is landed 
										//-> it takes off
										flying = true;
										my.drone.takeoff();
										console.log('TAKEOFF');
									}
								})
							}
						}
					}
					else{
						if(!stop_lastframe){
						
							//Leap motion doesn't detect hands -> stops the drone
							//in its actual position (keeps hovering)
							my.drone.stop();
							up_lastframe = false;
							down_lastframe = false;
							right_lastframe = false;
							left_lastframe = false;
							forward_lastframe = false;
							backwards_lastframe = false;
							stop_lastframe = true;
						}
					}
				}
			}
		})
	}
}).start();

//Enable flips again, after a certain timeout
function enableFlip(){
	flips = true;
	console.log('Flips enabled again');
}