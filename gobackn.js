/* eslint-disable-next-line no-unused-vars */
const goBackN = {
    sendNewPacket: null,
    pause: null,
    reset: null,
    speedUp: null,
    slowDown: null,
    dropPackets: null,

    init() {
        const elem = document.getElementById('canvas');
        const canvas = elem.getContext('2d');
        const canvasHeight = elem.height;
        const canvasWidth = elem.width;
        const textElem = document.getElementById('text-canvas');
        const textCanvas = textElem.getContext('2d');
        const textCanvasWidth = textElem.width;
        const textCanvasHeight = textElem.height;
        const numHosts = 20;
        const hostWidth = 40;
        const hostHeight = 60;
        const padding = 10;
        const packetXPos = 12;

        let globalDy = 0;
        let packetsSent = 0;
        let packetsDropped = false;
        let countDownInterval = null;
        let resendMessageVisible = false;
        let messageToScreen = 'Ready to run. Press \'Send New\' button to start.';
        let count = 16;
        let resendMessage = `Will resend in ${count} seconds`;
        let senders = new Array(numHosts);
        let receivers = new Array(numHosts);
        let packets = new Array(numHosts);
        let droppedPackets = new Array(numHosts);
        let packetsIndex = 0;
        let packetWindow;


        function drawSendersAndReceivers() {
            for (let i = 0; i < numHosts; i += 1) {
                senders[i].drawHost();
                receivers[i].drawHost();
            }
        }

        function drawPackets() {
            for (let i = 0; i < numHosts; i += 1) {
                if (packets[i]) {
                    packets[i].drawPacket();
                }
            }
        }

        function writeOnCanvas(text, x, y, colour, fontSize) {
            canvas.fillStyle = colour;
            canvas.font = `bold ${fontSize}px Arial`;
            canvas.fillText(text, x, y);
        }

        function writeSenderAndReceiverLabels() {
            writeOnCanvas('Receiver', 1050, 45, 'black', 16);
            writeOnCanvas('Sender', 1050, 410, 'black', 16);
        }

        function writeMessageToScreen(message, x, y) {
            textCanvas.fillStyle = 'black';
            textCanvas.font = 'bold 18px Arial';
            textCanvas.fillText(message, x, y);
        }

        function draw() {
            canvas.clearRect(0, 0, canvasWidth, canvasHeight);
            textCanvas.clearRect(0, 0, textCanvasWidth, textCanvasHeight);
            packetWindow.drawWindow();
            drawSendersAndReceivers();
            drawPackets();
            writeSenderAndReceiverLabels();
            writeMessageToScreen(messageToScreen, 15, 40);

            if (resendMessageVisible) {
                writeMessageToScreen(resendMessage, 550, 40);
            }
        }

        function drawRect(x, y, w, h, colour) {
            if (colour) {
                canvas.fillStyle = colour;
            } else {
                canvas.fillStyle = '#FFFFFF';
            }

            canvas.beginPath();
            canvas.strokeStyle = '#000000';
            canvas.rect(x, y, w, h);
            canvas.closePath();
            canvas.stroke();
            canvas.fill();
        }

        function noPacketDroppedPriorToThis(index) {
            let notDropped = true;
            for (let i = index; i >= 0; i -= 1) {
                if (!packets[i]) {
                    notDropped = false;
                }
            }
            return notDropped;
        }

        function Host(x, y, index, type, colour) {
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

        Host.prototype.drawHost = function () {
            drawRect(this.XPos, this.YPos, this.width, this.height, this.colour);

            if (this.receivedPacket === true) {
                let drawXPos = this.XPos + 16;
                const drawYPos = this.YPos + 33;

                if (this.index > 9) {
                    drawXPos -= 6;
                }

                this.drawOnReceiver(this.index, drawXPos, drawYPos);
            }
        };

        Host.prototype.drawOnReceiver = function (value, x, y) {
            writeOnCanvas(value, x, y, 'black', 16);
        };

        function Packet(index) {
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
            this.colour = 'yellow';
            this.drop = false;
            this.xPos = packetXPos + (this.index * this.xIncrement);
            this.isVisible = true;
        }

        Packet.prototype.dy = 1;

        Packet.prototype.setDyToOne = function () {
            this.dy = 1;
        };

        Packet.prototype.drawPacket = function () {
            if (this.isVisible) {
                drawRect(this.xPos, this.packetYPos, this.packetWidth, this.packetHeight, this.colour);
                let textXPos = 14;
                const textYPos = 30;
                if (this.index > 9) {
                    textXPos = 9;
                }
                writeOnCanvas(this.index, this.xPos + textXPos, this.packetYPos + textYPos, 'black', 16);
                this.sendPacket();
            }
        };

        Packet.prototype.clearPacket = function () {
            const x = this.xPos - 2;
            canvas.clearRect(x, this.packetYPos, this.packetWidth + 5, this.packetHeight + 5);
        };

        Packet.prototype.sendPacket = function () {
            if ((this.packetYPos > this.upperYCoOrd) && this.isSyn) {
                this.packetYPos -= this.dy;
            } else if (this.isSyn) {
                if (this.index === 0 || noPacketDroppedPriorToThis(this.index)) {
                    receivers[this.index].colour = 'orange';
                    receivers[this.index].receivedPacket = true;
                    this.isSyn = false;
                    messageToScreen = `Packet ${this.index} received, acknowledgement sent.`;
                } else {
                    packets[this.index] = null;
                    droppedPackets[this.index] = true; // all subsequently dropped packets
                }
            } else {
                this.sendAck();
                receivers[this.index].sentPacket = true;
            }
        };

        Packet.prototype.sendAck = function () {
            if ((this.packetYPos < this.lowerYCoOrd) && !this.isSyn) {
                if (this.packetYPos + this.dy > this.lowerYCoOrd) {
                    this.dy = this.lowerYCoOrd - this.packetYPos;
                }
                this.packetYPos += this.dy;
            } else if (packets[this.index]) {
                packetsSent -= 1;
                if (this.index > 0 && !packets[this.index - 1]) {
                    packetsSent -= 1;
                    const invisiblePacket = new Packet(this.index - 1);
                    invisiblePacket.isVisible = false;
                    packets[this.index - 1] = invisiblePacket;
                    senders[this.index - 1].receivedPacket = true;
                }
                packets[this.index].isVisible = false;
                senders[this.index].receivedPacket = true;
                messageToScreen = `Acknowledgement for packet ${this.index} received.`;
            }
        };

        function createPacket(index) {
            const packet = new Packet(index);
            packets[index] = packet;
            senders[index].sentPacket = true;
            senders[index].colour = 'blue';
            messageToScreen = `Packet ${index} sent.`;
        }

        function PacketWindow(x, y, h, w) {
            this.x = x;
            this.y = y;
            this.h = h;
            this.w = w;
            this.xIncrement = 50;

            this.drawWindow = function () {
                for (let i = 1; i < numHosts; i += 1) {
                    if (senders[i - 1].receivedPacket && !senders[i - 1].isDrawn) {
                        this.incrementXPos();
                        senders[i - 1].isDrawn = true;
                    }
                }
                drawRect(this.x, this.y, this.h, this.w, null);
            };

            this.incrementXPos = function () {
                if (this.x < 750) this.x += (hostWidth + 10);
            };
        }

        function createSendersAndReceivers() {
            const senderY = (canvasHeight - hostHeight) - 10;
            const receiverY = 10;
            let x = 10;
            const xIncrement = hostWidth + padding;

            for (let i = 0; i < numHosts; i += 1) {
                const aSender = new Host(x, senderY, i, 'sender', null);
                const aReceiver = new Host(x, receiverY, i, 'receiver', null);
                senders[i] = aSender;
                receivers[i] = aReceiver;
                x += xIncrement;
            }
        }

        function resendPackets() {
            clearInterval(countDownInterval);
            resendMessageVisible = false;
            count = 16;
            let totalPacketsDropped = 1;
            let lastPacketDropped = 0;

            for (let i = 0; i < droppedPackets.length; i += 1) {
                if (droppedPackets[i] === true) {
                    totalPacketsDropped -= 1;
                    lastPacketDropped = i;
                    createPacket(i);
                    packets[i].drawPacket();
                    droppedPackets[i] = null;
                }
            }

            const firstPacketDropped = lastPacketDropped + totalPacketsDropped;

            if (firstPacketDropped !== lastPacketDropped) {
                messageToScreen = `Resending Packets ${firstPacketDropped} - ${lastPacketDropped}`;
            } else {
                messageToScreen = `Resending Packet ${firstPacketDropped}`;
            }
            packetsDropped = false;
        }

        function selectPacket(x, y) {
            for (let i = 0; i < packets.length; i += 1) {
                if (packets[i]) {
                    const xMin = packets[i].xPos;
                    const xMax = xMin + packets[i].packetWidth;
                    const yMin = packets[i].packetYPos;
                    const yMax = yMin + packets[i].packetHeight;

                    if ((x < xMax && x > xMin) && (y < yMax && y > yMin)) {
                        packets[i].drop = true;
                        packets[i].colour = 'green';
                        packets[i].clearPacket();
                        packets[i].drawPacket();
                    }
                }
            }
        }

        function countDownTime() {
            count -= 1;
            resendMessage = `Will resend in ${count} seconds`;
        }

        this.pause = function () {
            const label = document.getElementById('pause-button').value;

            if (label === 'stop animation') {
                document.getElementById('pause-button').value = 're-start';
                document.getElementById('kill-button').disabled = false;
                document.getElementById('send-button').disabled = true;
                document.getElementById('speed-button').disabled = true;
                document.getElementById('slow-button').disabled = true;
                document.getElementById('reset-button').disabled = true;
                globalDy = Packet.prototype.dy;
                Packet.prototype.dy = 0;
            } else {
                document.getElementById('pause-button').value = 'stop animation';
                document.getElementById('kill-button').disabled = true;
                document.getElementById('send-button').disabled = false;
                document.getElementById('speed-button').disabled = false;
                document.getElementById('slow-button').disabled = false;
                document.getElementById('reset-button').disabled = false;
                Packet.prototype.dy = globalDy;
                globalDy = 0;
            }
        };

        this.reset = function () {
            senders = new Array(numHosts);
            receivers = new Array(numHosts);
            packets = new Array(numHosts);
            droppedPackets = new Array(numHosts);
            packetsIndex = 0;
            packetWindow = new PacketWindow(5, canvasHeight - 75, 250, 70);
            createSendersAndReceivers();
            setInterval(draw, 15);
            packetsSent = 0;
            messageToScreen = 'Ready to run. Press \'Send New\' button to start.';
            globalDy = 0;
            packetsDropped = false;
            countDownInterval = null;
            count = 16;
            resendMessage = `Will resend in ${count} seconds`;
            resendMessageVisible = false;
            Packet.prototype.dy = 1;

            if (document.getElementById('pause-button').value === 're-start') {
                document.getElementById('pause-button').value = 'stop animation';
                document.getElementById('kill-button').disabled = true;
            }
        };

        this.speedUp = function () {
            let dy = Packet.prototype.dy;
            if (dy > 0) {
                dy += 1;
                Packet.prototype.dy = dy;
            }
        };

        this.slowDown = function () {
            if (Packet.prototype.dy > 1) {
                Packet.prototype.dy -= 1;
            }
        };

        this.dropPackets = function () {
            for (let i = 0; i < packets.length; i += 1) {
                let shouldResend = false;
                if (packets[i]) {
                    if (packets[i].drop === true) {
                        if (receivers[i].receivedPacket === false) {
                            shouldResend = true;
                            packets[i] = null;
                            packetsDropped = true;
                            droppedPackets[i] = true; // the first dropped packet
                        } else if (receivers[i].receivedPacket === true) {
                            packets[i] = null;

                            if (packetsSent === 1 || packetsSent === 5) {
                                shouldResend = true;
                                packetsDropped = true;
                                droppedPackets[i] = true;
                            }
                        }
                    }
                }
                // buggy need to try fix for multiple dropped
                if (shouldResend) {
                    countDownInterval = setInterval(countDownTime, 1000);
                    resendMessageVisible = true;
                    setTimeout(() => {
                        resendPackets();
                    }, 15000);
                }
            }
        };

        this.sendNewPacket = function () {
            if (((packetsSent < 5) && (packetsIndex < 20)) && !packetsDropped) {
                createPacket(packetsIndex);
                packetsIndex += 1;
                packetsSent += 1;
            }
        };

        packetWindow = new PacketWindow(5, canvasHeight - 75, 250, 70);
        createSendersAndReceivers();
        setInterval(draw, 15);

        $('canvas').click((e) => {
            const clickedXPos = e.pageX;
            const clickedYPos = e.pageY;
            selectPacket(clickedXPos, clickedYPos);
        });
    }
};
