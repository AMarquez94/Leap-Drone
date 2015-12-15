var Cylon = require('cylon');

var flying = false;
var init = false;
var startRecording = false;
var flips = true;
var handInitialPosition = [];
var handInitialDirection = [];
var X_THRESHOLD = 80;
var Z_THRESHOLD = 80;
var Y_THRESHOLD_UP = 80;
var Y_THRESHOLD_DOWN = -50;

var up_lastframe = false;
var down_lastframe = false;
var right_lastframe = false;
var left_lastframe = false;
var forward_lastframe = false;
var backwards_lastframe = false;
var stop_lastframe = false;


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
				
				if(frame.valid && frame.gestures.length > 0){
					frame.gestures.forEach(function(g){
						if(g.type == 'keyTap'){
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
				if(frame.valid){
					if(frame.hands.length > 0){
					
						if(flying){
							
							var handPosition, handDirection;
							
							handPosition = frame.hands[0].palmPosition;
							handDirection = frame.hands[0].direction;
							
		
							var x = Math.abs(handPosition[0] - handInitialPosition[0]) > X_THRESHOLD;
							var z = Math.abs(handPosition[2] - handInitialPosition[2]) > Z_THRESHOLD;
							var y_up = (handPosition[1] - handInitialPosition[1]) > Y_THRESHOLD_UP;
							var y_down = (handPosition[1] - handInitialPosition[1]) < Y_THRESHOLD_DOWN;
							var moved = x || z || y_up || y_down;
							
							if(moved){
								if(x){
									var right = (handPosition[0] - handInitialPosition[0]) > 0;
									
									if(right){
										if(right_lastframe){
											console.log("Moving drone to right (no message)");
										}
										else{
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
										if(left_lastframe){
											console.log("Moving drone to left (no message)");
										}
										else{
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
										if(backwards_lastframe){
											console.log("Moving drone backwards (no message)");
										}
										else{
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
										if(forward_lastframe){
											console.log("Moving drone forward (no message)");
										}
										else{
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
									if(up_lastframe){
											console.log("Moving drone up (no message)");
									}
									else{
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
									if(down_lastframe){
										console.log("Moving drone down (no message)");
									}
									else{
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
							else{
								if(!stop_lastframe){
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
									frame.gestures.forEach(function(g){
										if(g.type == 'keyTap'){
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
										
										else if(g.type == 'circle' && flying){
											if(g.normal[2] < 0){
												my.drone.clockwise(0.3);
												console.log('Turning right');
											}
											else{
												my.drone.counterClockwise(0.3);
												console.log('Turning left');
											}
										}
										
										else if(g.type == 'swipe' && flying){
										
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
														flips = false;
														console.log('Swipe left');
														my.drone.leftFlip();
														my.drone.animateLeds('blinkRed',5,3);
														setTimeout(enableFlip, 3000);
													}
													
												} else {
													if(flips){
														flips = false;
														console.log('Swipe right');
														my.drone.rightFlip();
														my.drone.animateLeds('blinkRed',5,3);
														setTimeout(enableFlip, 3000);
													}
												}
											}
											
											if(superiorPosition === zAxis){
												if(yDirection > 0){
													if(flips){
														flips = false;
														console.log('Swipe front');
														my.drone.frontFlip();
														my.drone.animateLeds('blinkRed',5,3);
														setTimeout(enableFlip, 3000);
													}
												} else {
													if(flips){
														flips = false;
														console.log('Swipe back');
														my.drone.backFlip();
														my.drone.animateLeds('blinkRed',5,3);
														setTimeout(enableFlip, 3000);
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

function enableFlip(){
	flips = true;
	console.log('Flips enabled again');
}