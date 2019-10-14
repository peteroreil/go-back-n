var goBackN = 
{		
	sendNewPacket : null,
	pause : null,
	reset : null,
	speedUp : null,
	slowDown : null,
	dropPackets : null,
		
	init : function()
	{	
		var elem = document.getElementById("canvas");		
		var canvas = elem.getContext("2d");
		var canvasHeight = elem.height;
		var canvasWidth  = elem.width;
		var textElem = document.getElementById("text-canvas");
		var textCanvas = textElem.getContext("2d");
		var textCanvasWidth = textElem.width;
		var textCanvasHeight = textElem.height;
		var numHosts   = 20;		
		var hostWidth  = 40;
		var hostHeight = 60;
		var padding    = 10;
		var packetXPos = 12;
		var senders   = new Array(numHosts);
		var receivers = new Array(numHosts);
		var packets   = new Array(numHosts);
		var droppedPackets = new Array(numHosts);
		var packetsIndex = 0;	
		var packetWindow = new PacketWindow(5, canvasHeight - 75, 250, 70);
		createSendersAndReceivers();
		var interval = setInterval(draw, 15);
		var packetsSent = 0;
		var messageToScreen = "Ready to run. Press 'Send New' button to start."
		var globalDy = 0;
		var packetsDropped = false;
		var countDownInterval = null;
		var count = 16;
		var resendMessage = "Will resend in "+count+" seconds";
		resendMessageVisible = false;
						
		function draw()
		{
			canvas.clearRect(0,0, canvasWidth, canvasHeight);
			textCanvas.clearRect(0,0, textCanvasWidth, textCanvasHeight);
			packetWindow.drawWindow();
			drawSendersAndReceivers();	
			drawPackets();
			writeSenderAndReceiverLabels();
			writeMessageToScreen(messageToScreen, 15, 40);
			
			if(resendMessageVisible)
			{
				writeMessageToScreen(resendMessage, 550, 40);
			}
		}
		
		function selectPacket(x, y)
		{			
			for(var i = 0; i < packets.length; i++)
			{
				if(packets[i])
				{
					var xMin = packets[i].xPos;
					var xMax = xMin + packets[i].packetWidth;
					var yMin = packets[i].packetYPos;
					var yMax = yMin + packets[i].packetHeight;
									
					if((x < xMax && x > xMin) && (y < yMax && y > yMin))
					{
						packets[i].drop = true;
						packets[i].colour = "green";
						packets[i].clearPacket();
		            packets[i].drawPacket();
					}
				}
			}			
		}
		
		
		
		function writeOnCanvas(text, x, y, colour, fontSize)
		{
			canvas.fillStyle = colour;
  			canvas.font = "bold "+fontSize+"px Arial";
  			canvas.fillText(text, x, y);
		}
		
		function writeMessageToScreen(message, x, y)
		{
			textCanvas.fillStyle = "black";
			textCanvas.font = "bold 18px Arial";
			textCanvas.fillText(message, x, y);
		}
		
		function writeSenderAndReceiverLabels()
		{
			writeOnCanvas("Receiver", 1050, 45, "black", 16);
			writeOnCanvas("Sender", 1050, 410, "black", 16);
		}
				
		this.pause = function()
		{
			var label = document.getElementById('pause-button').value;
			
			if(label === "stop animation")
			{
				document.getElementById('pause-button').value = "re-start";
				document.getElementById('kill-button').disabled = false;
				document.getElementById('send-button').disabled = true;
				document.getElementById('speed-button').disabled = true;
				document.getElementById('slow-button').disabled = true;
				document.getElementById('reset-button').disabled = true;
				globalDy = Packet.prototype.dy;
				Packet.prototype.dy = 0;
			}
			
			else
			{
				document.getElementById('pause-button').value = "stop animation";
				document.getElementById('kill-button').disabled = true;
				document.getElementById('send-button').disabled = false;
				document.getElementById('speed-button').disabled = false;
				document.getElementById('slow-button').disabled = false;
				document.getElementById('reset-button').disabled = false;
				
				Packet.prototype.dy = globalDy;
				globalDy = 0;
			}
		}
				
		this.reset = function()
		{
			
			 senders   = new Array(numHosts);
			 receivers = new Array(numHosts);
			 packets   = new Array(numHosts);
			 droppedPackets = new Array(numHosts);
			 packetsIndex = 0;	
			 packetWindow = new PacketWindow(5, canvasHeight - 75, 250, 70);
			 createSendersAndReceivers();
			 interval = setInterval(draw, 15);
			 packetsSent = 0;
			 messageToScreen = "Ready to run. Press 'Send New' button to start."
			 globalDy = 0;
			 packetsDropped = false;
			 countDownInterval = null;
			 count = 16;
			 resendMessage = "Will resend in "+count+" seconds";
		    resendMessageVisible = false;
			 Packet.prototype.dy = 1;
			 
			 if(document.getElementById('pause-button').value === "re-start")
			 {	
			 		document.getElementById('pause-button').value =  "stop animation";
			 		document.getElementById('kill-button').disabled = true;
			 }
		}
		
		this.speedUp = function()
		{
			var dy = Packet.prototype.dy;
			if(dy > 0)
			{
				dy += 1;
				Packet.prototype.dy = dy;
			}
			
		}
		
		this.slowDown = function()
		{
			if(Packet.prototype.dy > 1)
			{
				Packet.prototype.dy -= 1;
			}
		}
		
		this.dropPackets = function()
		{
			for(var i = 0; i < packets.length; i++)
			{
				var shouldResend = false;
				
				if(packets[i])
				{
					if(packets[i].drop == true)
					{
						if(receivers[i].receivedPacket == false)
						{
							shouldResend = true;
							packets[i] = null;
							packetsDropped = true;
							droppedPackets[i] = true; // the first dropped packet
						}
						
						else if(receivers[i].receivedPacket == true)
						{							
							packets[i]=null;
							
							if(packetsSent===1 || packetsSent===5)
							{
								shouldResend = true;
								packetsDropped = true;
								droppedPackets[i] = true;
							}
						}					
					}
				}
				
				if(shouldResend)  //buggy need to try fix for multiple dropped 
				{
					countDownInterval = setInterval(countDownTime,1000);
					resendMessageVisible = true;
					setTimeout(function(){resendPackets();}, 15000);
				}
			}
		}
		
		function countDownTime()
		{
			count -= 1;
			resendMessage = "Will resend in "+count+" seconds"
		}
		
		function PacketWindow(x, y ,h, w)
		{
			this.x = x;
			this.y = y;
			this.h = h;
			this.w = w;
			this.xIncrement = 50;
			
			this.drawWindow = function()
			{
				
				for(var i = 1 ; i < numHosts; i++)
				{
					if(senders[i-1].receivedPacket && !senders[i-1].isDrawn)
					{
						this.incrementXPos();
						senders[i-1].isDrawn = true;
					}
				}
				
				drawRect(this.x, this.y, this.h, this.w, null);
			}
			
			this.incrementXPos = function()
			{
				if(this.x<750)
				this.x += (hostWidth + 10);				
			}
		}
		
		function Packet(index)
		{
			this.upperYCoOrd = 12; 
			this.lowerYCoOrd = 382;      
			this.packetWidth = 36;       
			this.packetHeight = 56;
			this.packetXPos = 12;        
			this.packetYPos = this.lowerYCoOrd;
			this.cellWidth = 40;
			this.index = index;
			this.xIncrement = 50;
			this.isSyn = true;		
			this.colour = "yellow";
			this.drop = false;
			this.xPos = packetXPos + (this.index * this.xIncrement);
			this.isVisible = true;
		}
		
		Packet.prototype.dy = 1;  
		
		Packet.prototype.setDyToOne = function()
		{				
			this.dy = 1;
		}
		
		Packet.prototype.drawPacket = function()
		{	
			if(this.isVisible)
			{						
				drawRect(this.xPos, this.packetYPos, this.packetWidth, this.packetHeight, this.colour);
			
				var textXPos = 14;
				var textYPos = 30;
			
				if(this.index > 9)
				{
					textXPos = 9;
				}
						
				writeOnCanvas(this.index, this.xPos + textXPos, this.packetYPos + textYPos, "black", 16);
							
				this.sendPacket(); 
			}											
		}
		
		Packet.prototype.clearPacket = function(index)
		{
			var x = this.xPos - 2;
			canvas.clearRect(x, this.packetYPos, this.packetWidth+5, this.packetHeight+5);
		}
		
		
		
		Packet.prototype.sendPacket = function()
		{				
			if((this.packetYPos > this.upperYCoOrd) && this.isSyn)
			{
				this.packetYPos -= this.dy;									
			}
				
			else if(this.isSyn)
			{
				if(this.index == 0 || noPacketDroppedPriorToThis(this.index))
				{			
					receivers[this.index].colour = "orange";
					receivers[this.index].receivedPacket = true;
					this.isSyn = false;
					messageToScreen = "Packet "+ this.index + " received, acknowledgement sent.";
				}

				else
				{
					packets[this.index] = null;
					droppedPackets[this.index] = true; // all subsequently dropped packets
				}

			}
				
			else 
			{
				this.sendAck();
				receivers[this.index].sentPacket = true;
			}
			
		}
		
		
		
		Packet.prototype.sendAck = function()
		{	
			if((this.packetYPos < this.lowerYCoOrd) && !this.isSyn) 
			{
				if(this.packetYPos + this.dy > this.lowerYCoOrd) 
				{
					this.dy = this.lowerYCoOrd - this.packetYPos;   
				}
				
				this.packetYPos += this.dy
			}
			
			else
			{
				if(packets[this.index])
				{
					packetsSent--;	
					
					if(this.index > 0 && !packets[this.index - 1])
					{
						packetsSent--;
						var invisiblePacket = new Packet(this.index-1);
						invisiblePacket.isVisible = false;
						packets[this.index-1] = invisiblePacket;
					   senders[this.index -1].receivedPacket = true;	
					}
					
					packets[this.index].isVisible = false;
					senders[this.index].receivedPacket = true;
					messageToScreen = "Acknowledgement for packet "+ this.index + " received.";
				}
				
			}
		}
			
		
		function noPacketDroppedPriorToThis(index)
		{
			var notDropped = true;
			
			for(var i = index ; i >= 0 ; i--)
			{
				if(!packets[i])
				{
				     notDropped = false;					
				}
			}
			
			return notDropped;
		}

		this.sendNewPacket = function()
		{
			if(((packetsSent < 5) && (packetsIndex < 20)) && !packetsDropped)
			{
				createPacket(packetsIndex);				
				packetsIndex++;
				packetsSent++;				
			}
		}
		
				
		function resendPackets()
		{
			
			clearInterval(countDownInterval);
			resendMessageVisible = false;
			count = 16;
			var totalPacketsDropped = 1;
			var lastPacketDropped = 0;
							
			for(var i = 0; i < droppedPackets.length; i++)
			{
				
				if(droppedPackets[i] == true)
				{	
					totalPacketsDropped--;
					lastPacketDropped = i;
					createPacket(i);
					packets[i].drawPacket();
					droppedPackets[i] = null;
				}
			}
			
			var firstPacketDropped = lastPacketDropped + totalPacketsDropped;
			
			if(firstPacketDropped != lastPacketDropped)
			{
				messageToScreen = "Resending Packets "+firstPacketDropped+" - "+lastPacketDropped;
			}
			
			else 
			{
				messageToScreen = "Resending Packet "+firstPacketDropped;
			}
			
			packetsDropped = false;			
		}
		
		function createPacket(index)
		{
			   var packet = new Packet(index);
				packets[index] = packet;
				senders[index].sentPacket = true;
				senders[index].colour = "blue"; 
				messageToScreen = "Packet "+ index+ " sent.";
		}
		
		// draw all packets
		function drawPackets()
		{
			for(var i = 0; i < numHosts; i++)
			{
				if(packets[i])
				{
					packets[i].drawPacket();
				}
			}
		}
		
		
		// draw senders and receivers
		function drawSendersAndReceivers()
		{						
			for(var i = 0; i < numHosts; i++)
			{
				senders[i].drawHost();
				receivers[i].drawHost();
			}
		}
		
		
		// host constructor
		function Host(x, y, index, type, colour)
		{		
			this.width = hostWidth;        
			this.height = hostHeight;       
			this.XPos = x;        
			this.YPos = y;        
			this.index = index;
			this.type = type;
			this.colour = colour;
			this.sentPacket = false;
			this.receivedPacket = false;
			this.isDrawn = false;
		}
		
		Host.prototype.drawHost = function()
		{
			drawRect(this.XPos,this.YPos, this.width, this.height, this.colour);
			
			if(this.receivedPacket == true)
			{
				var drawXPos = this.XPos + 16;
			    var drawYPos = this.YPos + 33;
				
				if(this.index > 9)
				{
					drawXPos -= 6;
				}
				
				this.drawOnReceiver(this.index, drawXPos, drawYPos);
			}
		}
		
		Host.prototype.drawOnReceiver = function(value, x, y)
		{
			writeOnCanvas(value, x, y, "black", 16);
		}
		
		function createSendersAndReceivers()
		{
			var senderY = (canvasHeight - hostHeight) - 10;
			var receiverY = 10;
			var x = 10;
			var xIncrement = hostWidth + padding; 
			
			for(var i = 0; i < numHosts; i++)
			{
				var aSender = new Host(x, senderY, i, "sender", null);
				var aReceiver = new Host(x, receiverY, i, "receiver", null);
				senders[i] = aSender;
				receivers[i] = aReceiver;
				x += xIncrement;
			}
		}
		
		$('canvas').click(
		
			function(e)
			{
				var clickedXPos = e.pageX;
				var clickedYPos = e.pageY;	
				selectPacket(clickedXPos, clickedYPos); 
			}		
		);		
		
		
		// draw a rectangle on canvas
		 function drawRect(x,y,w,h,colour)
			{
				if(colour)
				{
					canvas.fillStyle = colour;
				}
				
				else
				{
					canvas.fillStyle = "#FFFFFF";
				}
				
				canvas.beginPath();
				canvas.strokeStyle = "#000000";
				canvas.rect(x, y, w, h);
				canvas.closePath();
				canvas.stroke();
				canvas.fill();	
			}	
	}
}