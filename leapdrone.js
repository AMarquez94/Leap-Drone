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
							
							if(x){
								var right = (handPosition[0] - handInitialPosition[0]) > 0;
								
								if(right){
									my.drone.right(0.2);
									console.log("Moving drone to right");
								}
								else{
									my.drone.left(0.2);
									console.log("Moving drone to left");
								}
							}
							
							else if(z){
								var backwards = (handPosition[2] - handInitialPosition[2]) > 0;
								
								if(backwards){		
									my.drone.back(0.2);
									console.log("Moving drone backwards");
								}
								else{
									my.drone.forward(0.2);
									console.log("Moving drone forward");
								}
							}
							
							else if(y_up){
								//var up = (handPosition[1] - handInitialPosition[1]) > 0;
								
								//if(up){
									my.drone.up(0.3);
									console.log("Moving drone up");
								/*}
								else{
									my.drone.down(0.2);
									console.log("Moving drone down");
								}*/
							}
							
							else if(y_down){
								my.drone.down(0.3);
								console.log("Moving drone down");
							}
							
							else{
								my.drone.stop();
							}
						}
						
						if(frame.gestures.length > 0){
							frame.gestures.forEach(function(g){
								if(g.type == 'keyTap'){
									if(!flying){
										flying = true;
										my.drone.takeoff();
										console.log('TAKEOFF');
									}
									else{
										flying = false;
										my.drone.land();
										my.drone.stop();
										console.log('LAND');
									}
								}
								
								if(g.type == 'circle' && flying){
									if(g.normal[2] < 0){
										my.drone.clockwise(0.3);
										console.log('Turning right');
									}
									else{
										my.drone.counterClockwise(0.3);
										console.log('Turning left');
									}
								}
								
								if(g.type == 'swipe' && flying){
								
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
												setTimeout(function(a){ 
													flips = true; 
													console.log('Now');
												}, 3000);
											}
											
										} else {
											if(flips){
												flips = false;
												console.log('Swipe right');
												my.drone.rightFlip();
												setTimeout(function(a){ 
													flips = true; 
													console.log('Now');
												}, 3000);
											}
										}
									}
									
									if(superiorPosition === yAxis){
										if(yDirection > 0){
											if(flips){
												flips = false;
												console.log('Swipe front');
												my.drone.frontFlip();
												setTimeout(function(a){ 
													flips = true; 
													console.log('Now');
												}, 3000);
											}
										} else {
											if(flips){
												flips = false;
												console.log('Swipe back 1');
												my.drone.backFlip();
												setTimeout(function(a){ 
													flips = true; 
													console.log('Now');
												}, 3000);
											}
										}
									}
									
									if(superiorPosition === zAxis){
										if(zDirection > 0){
											if(flips){
												flips = false;
												console.log('Swipe front 2');
												my.drone.frontFlip();
												setTimeout(function(a){ 
													flips = true; 
													console.log('Now');
												}, 3000);
											}
										} else {
											if(flips){
											flips = false;
												console.log('Swipe back 2');
												my.drone.backFlip();
												setTimeout(function(a){ 
													flips = true; 
													console.log('Now');
												}, 3000);
											}
										}
									}
						
								
								}
							})
						}
					}
					else{
						my.drone.stop();
					}
				}
			}
		})
	}
}).start();